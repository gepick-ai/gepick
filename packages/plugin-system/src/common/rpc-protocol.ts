/* eslint-disable no-restricted-syntax */
/* eslint-disable unicorn/error-message */
/* eslint-disable no-prototype-builtins */
/* eslint-disable ts/no-use-before-define */
/* eslint-disable ts/no-empty-object-type */
import { Event, ExtendedPromise } from '@gepick/plugin-system/common';

export interface MessageConnection {
  send: (msg: {}) => void
  onMessage: Event<any>
}

export interface IRPCProtocol {
  /**
   * Returns a proxy to an object addressable/named in the plugin process or in the main process.
   */
  getProxy: <T>(proxyId: ProxyIdentifier<T>) => T

  /**
   * Register manually created instance.
   */
  set: <T, R extends T>(identifier: ProxyIdentifier<T>, instance: R) => R

}

export class ProxyIdentifier<T> {
  public readonly id: string;
  constructor(public readonly isMain: boolean, id: string | T) {
    // TODO this is nasty, rewrite this
    this.id = (id as any).toString();
  }
}

export function createProxyIdentifier<T>(identifier: string): ProxyIdentifier<T> {
  return new ProxyIdentifier(false, identifier);
}

/**
 * rpc用来关联各种ext实现，比如commandRegistryExt，hostedPluginManagerExt等
 * 通过rpc.set()方法将这些ext实现关联到rpc上：extId 《==》 extImpl，功能上就是用字典的方式将extId和extImpl关联起来。
 * 我们同样将rpc分两个端看，rpc server和rpc client。
 * rpc server：就是创建完extImpl之后，关联到本地local exts字典上。并在创建multiplexor的时候，绑定了connection.onMessage事件，
 *            当有消息到来时，会调用receiveOneMessage方法，这个方法会根据消息的类型，分别调用receiveRequest，receiveReply，receiveReplyErr方法。
 *            不同的connection可能有不同的实现，比如在plugin host当中创建rpc，实际上conneciton.onMessage就是process.on('message')。只不过由于类型要求是Event<{}>，因此需要包装一下。
 *            在实现上先实现了Emitter，然后通过process.on('message')来触发Emitter的fire方法，从而触发onMessage事件。
 *
 * rpc client：希望请求rpc server执行某个ext的服务时，会按照如下方式来使用：
 *             const hostedExtManager = rpc.getProxy(MAIN_RPC_CONTEXT.HOSTED_PLUGIN_MANAGER_EXT);
 *             hostedExtManager.$initialize(backendInitPath, pluginMetadata);
 * 因此rpc被设计来既能用在server端，也能用在client端。
 *
 * 剖析getProxy方法：
 * 1. 首先会尝试找到对应id的代理，找不到就创建一个新的代理，并将其与id在proxies关联并保存起来。（proxies其实就是一个字典）
 * 2. 代理对象的创建是通过createProxy方法来实现的，这个方法会创建一个代理对象，并设置拦截器，拦截所有从该代理发出的属性调用，
 *    内部会将该属性包装为一个新的方法，关键逻辑是当方法调用起来后调用rpc的remoteCall方法。这里跟json-rpc的实现有点类似。
 * 3. remoteCall方法将利用rpc的multiplexor来发送消息，这里的消息是一个json字符串，包含了请求的id，proxyId，methodName，args等信息。
 *    由于proxy能够通过get拦截到指定方法名，因此实际上通过rpc.getProxy()获取到的proxy对象，就是一个可以发送rpc请求的对象。最终会被包装成
 *    一个消息，包含了请求的id，proxyId，methodName，args等信息。这个消息被multiplexor发送出去。
 * 4. multiplexor是一个rpc的发送器，它会将消息发送出去。至于消息底层如何发送，这个是由connection来实现的，不同的场景下，connection可能是不同的。
 *    比如，在plugin host当中创建rpc，实际上conneciton.send就是process.send，即将消息发送给了nodejs的父进程。
 *    比如，如果是在browser创建了server rpc，connection.send就是通过json-rpc的协议发送的，它的底层是websocket。
 *
 * 5. 利用rpc结合hostedExtManager.$initialize(backendInitPath, pluginMetadata)的过程：
 *   - 【Browser】：查看server rpc的具体实现是：
 *    ```typescript
 *    new RPCProtocolImpl({
            onMessage: this.watcher.onPostMessageEvent,
            send: message => {
                this.server.onMessage(JSON.stringify(message));
            }
     });
 *    ```
 *  - 【Brwoser】：hostedExtManager是一个proxy对象，代理plugin manager ext，此时调用$initialize方法，会走proxy get方法拦截，调用remoteCall方法，
 *  包装信息A：proxyId(plugin-manager-ext) + methodName($initialize) + args(backendInitPath, pluginMetadata)。
 *  消息通过multiplexor发送出去，最终会被connection发送出去。其中这里的connection就是：
 * ```typescript
 *  {
 *     onMessage: this.watcher.onPostMessageEvent,
 *    send: message => {
 *       this.server.onMessage(JSON.stringify(message));
 * }
 * ```
 * 消息被this.server.onMessage发送出去，正巧的是server是plugin-server的json-rpc proxy对象。ws连接到plugin-server服务的path上，发送消息。
 *
 * - 【Node】：plugin-server在node主进程接收消息，拿到了包装消息A，进而通过this.cp.send(message)转发该消息到plugin-host插件进程。
 *
 * - 【Plugin-Host】：plugin-host插件进程接收到消息后，通过emmitter.fire(JSON.parse(message));将消息解析后派发出去。那么由于plugin-host进程在创建的时候，便创立了
 * rpc protocol，并且设置了onMessage事件，因此这个消息会被rpc protocol接收到，进而调用receiveOneMessage方法，根据消息类型，分别调用receiveRequest。
 * 进而拿到消息A：proxyId(plugin-manager-ext) + methodName($initialize) + args(backendInitPath, pluginMetadata)。
 * 进而multiplexor调用this.invokeHandler(proxyId, msg.method, msg.args);从而根据proxyId找到对应的extImpl，调用$initialize方法，执行对应逻辑。
 *
 * - 【Plugin-Host】：完成后，再次利用multiplexor.replyOk或者replyErr发送消息，告知plugin-server，执行完毕。
 * 此时完成后，再次利用multiplexor.send的实现是process.send，即将消息发送给了nodejs的父进程。
 *
 * - 【Node】：而父进程当中早在fork plugin-host进程的时候，已经通过child_process.on('message')监听到了消息，进而调用client.postMessage(message);将消息发送给了web端。
 * 而由于client是一个json rpc proxy，它是在server启动的时候创建Plugin Server的ConnetionHandler的时候创建的一个json rpc proxy。当我们调用了client.postMessage(message)时，
 * 同样也是利用了proxy的get拦截，进而走json rpc的发送逻辑，通过ws发送给了同一个服务url的plugin-client服务。
 *
 * - 【Browser】：由于在web端启动的时候，早就利用WebSocketConnectionProvider createProxy方法，连接到同一个服务url的plugin-server服务，并设计了一个本端也为对端提供服务的对象，plugin client。
 *  所以一个ws url，发送给server端，就是要求plugin server来服务，发送给web端，就是要求plugin client来服务。这样一来，client.postMessage(message)其实就是消息B：methodName(postMessage) + args(message)。
 * 由于指定了path，那么会根据path找到对应的service，然后执行其postMessage方法。
 *
 * - 【Browser】：在执行postMessage方法的时候，就是将web端这头的 messageEmitter.fire(JSON.parse(message))执行起来，将消息派发给web端的其他地方。根据emitter的设计，我们需要找打emitter.event到底在哪里被使用了。
 * 由于在最开始我们设计server rpc的时候，又将onPostMessageEvent赋值给了onMessage。
 *
 *
 * 6. connection：connection决定了消息的传输方式和接收方式。其中onMessage决定了消息的接收方式，send决定了消息的传输方式。
 *    - plugin host：connection onMessage是process.on('message)， send本质上就是process.send。它们分别用来接收nodejs主进程的
 *    消息，以及发送消息给nodejs主进程。
 *    - browser：connection onMessage本质上是基于ws的json-rpc响应，send本质上是基于ws的json-rpc请求。
 *    - node：node主进程主要用来接收browser的ws请求，然后转发给plugin host；接收plugin host的请求，然后通过ws转发给browser。
 *
 *      - **browser消息转发给plugin host**：首先browser通过Plugin Server JSON-RPC Proxy发送ws请求到node主进程，node主进程的Plugin Server Connection Handler会交给Plugin Server处理该请求。
 *        Plugin Server会利用child_process模块将该消息转发给plugin host子进程。plugin host利用process.on('message')来接收该消息。在plugin host里头拿到具体消息后，利用emitter.fire将消息在
 *        plugin host本地派发。由于plugin host本地有个rpc通过emitter.event监听到了，该消息被rpc进行处理。在内部会被multiplexor接收，进而调用receiveOneMessage方法，进而解析该消息，查看
 *        需要调用的是哪个ext的哪个方法，进而调用ext的该方法，得到结果。
 *
 *      - **plugin host消息转发给browser**：plugin api ext可能需要调用plugin api main的某个方法。此时，plugin host端的rpc调用multiplexor调用connection send。在plugin host端，通过process.send来当作conneciton send。
 *        于是，消息被发送到了node主进程。node主进程的Plugin Server早就通过child_process.on('message')监听到了消息，进而调用client.postMessage(message)，它将通过Plugin Client JSON-RPC Proxy发送ws请求到browser。browser
 *        接收到了ws请求，找到了Plugin Client，并调用其postMessage方法，将消息派发出去。在browser本地，也有一个rpc，它通过emitter.event监听到了消息。于是plugin host发送到的消息，被rpc接收，进而在内部会被multiplexor接收，进而调用receiveOneMessage方法，进而解析该消息，查看
 *        需要调用的是哪个main的哪个方法，进而调用main的该方法，得到结果。
 */
export class RPCProtocol implements IRPCProtocol {
  private isDisposed: boolean;
  private readonly locals: { [id: string]: any };
  private readonly proxies: { [id: string]: any };
  private lastMessageId: number;
  private readonly invokedHandlers: { [req: string]: Promise<any> };
  private readonly pendingRPCReplies: { [msgId: string]: ExtendedPromise<any> };
  private readonly multiplexor: RPCMultiplexer;

  constructor(connection: MessageConnection) {
    this.isDisposed = false;
    this.locals = Object.create(null);
    this.proxies = Object.create(null);
    this.lastMessageId = 0;
    this.invokedHandlers = Object.create(null);
    this.pendingRPCReplies = {};
    this.multiplexor = new RPCMultiplexer(connection, msg => this.receiveOneMessage(msg));
  }

  /**
   * 尝试找到对应id的代理，找不到就创建一个新的代理，并将其与id在proxies关联并保存起来。
   */
  getProxy<T>(proxyId: ProxyIdentifier<T>): T {
    if (!this.proxies[proxyId.id]) {
      this.proxies[proxyId.id] = this.createProxy(proxyId.id);
    }
    return this.proxies[proxyId.id];
  }

  /**
   * 将target和id在locals中关联
   */
  set<T, R extends T>(identifier: ProxyIdentifier<T>, instance: R): R {
    this.locals[identifier.id] = instance;
    return instance;
  }

  /**
   * 给定一个id，创一个代理对象，并设置拦截器，拦截所有从该代理发出的属性调用，
   * 内部会将该属性包装为一个新的方法，关键逻辑是当方法调用起来后调用rpc的remoteCall方法。
   */
  private createProxy<T>(proxyId: string): T {
    const handler = {
      get: (target: any, name: string) => {
        if (!target[name] && name.charCodeAt(0) === 36 /* CharCode.DollarSign */) {
          target[name] = (...myArgs: any[]) =>
            this.remoteCall(proxyId, name, myArgs);
        }
        return target[name];
      },
    };
    return new Proxy(Object.create(null), handler);
  }

  /**
   * 要使用哪个代理（proxyId标志着一个唯一的proxy）的哪个方法（method Name），并向该方法传递指定参数（args）
   */
  private remoteCall(proxyId: string, methodName: string, args: any[]): Promise<any> {
    if (this.isDisposed) {
      return Promise.reject(canceled());
    }

    const callId = String(++this.lastMessageId);
    const result = new ExtendedPromise();

    this.pendingRPCReplies[callId] = result;
    this.multiplexor.send(MessageFactory.request(callId, proxyId, methodName, args));
    return result;
  }

  private receiveOneMessage(rawmsg: string): void {
    if (this.isDisposed) {
      return;
    }

    const msg = <RPCMessage>JSON.parse(rawmsg);

    switch (msg.type) {
      case MessageType.Request:
        this.receiveRequest(msg);
        break;
      case MessageType.Reply:
        this.receiveReply(msg);
        break;
      case MessageType.ReplyErr:
        this.receiveReplyErr(msg);
        break;
    }
  }

  private receiveRequest(msg: RequestMessage): void {
    const callId = msg.id;
    const proxyId = msg.proxyId;

    this.invokedHandlers[callId] = this.invokeHandler(proxyId, msg.method, msg.args);

    this.invokedHandlers[callId].then((r) => {
      delete this.invokedHandlers[callId];
      this.multiplexor.send(MessageFactory.replyOK(callId, r));
    }, (err) => {
      delete this.invokedHandlers[callId];
      this.multiplexor.send(MessageFactory.replyErr(callId, err));
    });
  }

  private receiveReply(msg: ReplyMessage): void {
    const callId = msg.id;
    if (!this.pendingRPCReplies.hasOwnProperty(callId)) {
      return;
    }

    const pendingReply = this.pendingRPCReplies[callId];
    delete this.pendingRPCReplies[callId];

    pendingReply.resolve(msg.res);
  }

  private receiveReplyErr(msg: ReplyErrMessage): void {
    const callId = msg.id;
    if (!this.pendingRPCReplies.hasOwnProperty(callId)) {
      return;
    }

    const pendingReply = this.pendingRPCReplies[callId];
    delete this.pendingRPCReplies[callId];

    let err: Error | null = null;
    if (msg.err && msg.err.$isError) {
      err = new Error();
      err.name = msg.err.name;
      err.message = msg.err.message;
      err.stack = msg.err.stack;
    }
    pendingReply.reject(err);
  }

  private invokeHandler(proxyId: string, methodName: string, args: any[]): Promise<any> {
    try {
      return Promise.resolve(this.doInvokeHandler(proxyId, methodName, args));
    }
    catch (err) {
      return Promise.reject(err);
    }
  }

  private doInvokeHandler(proxyId: string, methodName: string, args: any[]): any {
    if (!this.locals[proxyId]) {
      throw new Error(`Unknown actor ${proxyId}`);
    }
    const actor = this.locals[proxyId];
    const method = actor[methodName];
    if (typeof method !== 'function') {
      throw new TypeError(`Unknown method ${methodName} on actor ${proxyId}`);
    }
    return method.apply(actor, args);
  }
}

function canceled(): Error {
  const error = new Error('Canceled');
  error.name = error.message;
  return error;
}

/**
 * Sends/Receives multiple messages in one go:
 *  - multiple messages to be sent from one stack get sent in bulk at `process.nextTick`.
 *  - each incoming message is handled in a separate `process.nextTick`.
 */
class RPCMultiplexer {
  private readonly connection: MessageConnection;
  private readonly sendAccumulatedBound: () => void;

  private messagesToSend: string[];

  constructor(connection: MessageConnection, onMessage: (msg: string) => void) {
    this.connection = connection;
    this.sendAccumulatedBound = this.sendAccumulated.bind(this);

    this.messagesToSend = [];

    this.connection.onMessage((data: string[]) => {
      const len = data.length;
      for (let i = 0; i < len; i++) {
        onMessage(data[i]);
      }
    });
  }

  private sendAccumulated(): void {
    const tmp = this.messagesToSend;
    this.messagesToSend = [];
    this.connection.send(tmp);
  }

  public send(msg: string): void {
    if (this.messagesToSend.length === 0) {
      setImmediate(this.sendAccumulatedBound);
    }
    this.messagesToSend.push(msg);
  }
}

class MessageFactory {
  public static request(req: string, rpcId: string, method: string, args: any[]): string {
    return `{"type":${MessageType.Request},"id":"${req}","proxyId":"${rpcId}","method":"${method}","args":${JSON.stringify(args)}}`;
  }

  public static replyOK(req: string, res: any): string {
    if (typeof res === 'undefined') {
      return `{"type":${MessageType.Reply},"id":"${req}"}`;
    }
    return `{"type":${MessageType.Reply},"id":"${req}","res":${JSON.stringify(res)}}`;
  }

  public static replyErr(req: string, err: any): string {
    if (err instanceof Error) {
      return `{"type":${MessageType.ReplyErr},"id":"${req}","err":${JSON.stringify(transformErrorForSerialization(err))}}`;
    }
    return `{"type":${MessageType.ReplyErr},"id":"${req}","err":null}`;
  }
}

const enum MessageType {
  Request = 1,
  Reply = 2,
  ReplyErr = 3,
}

class RequestMessage {
  type: MessageType.Request;
  id: string;
  proxyId: string;
  method: string;
  args: any[];
}

class ReplyMessage {
  type: MessageType.Reply;
  id: string;
  res: any;
}

class ReplyErrMessage {
  type: MessageType.ReplyErr;
  id: string;
  err: SerializedError;
}

type RPCMessage = RequestMessage | ReplyMessage | ReplyErrMessage;

export interface SerializedError {
  readonly $isError: true
  readonly name: string
  readonly message: string
  readonly stack: string
}

export function transformErrorForSerialization(error: Error): SerializedError {
  if (error instanceof Error) {
    const { name, message } = error;
    const stack: string = (<any>error).stacktrace || error.stack;
    return {
      $isError: true,
      name,
      message,
      stack,
    };
  }

  // return as is
  return error;
}
