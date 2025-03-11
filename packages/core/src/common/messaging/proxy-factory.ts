import { IConnectionHandler, Disposable, Emitter, Event } from "@gepick/core/common";
import { MessageConnection } from "./vscode-ws-jsonrpc";

export type RpcServer<Client> = Disposable & {
  /**
   * If this server is a proxy to a remote server then
   * a client is used as a local object
   * to handle JSON-RPC messages from the remote server.
   */
  setClient: (client: Client | undefined) => void
};

export interface RpcConnectionEventEmitter {
  readonly onDidOpenConnection: Event<void>
  readonly onDidCloseConnection: Event<void>
}
export type RpcProxy<T> = T & RpcConnectionEventEmitter;

export class RpcConnectionHandler<T extends object> implements IConnectionHandler {
  constructor(
    readonly path: string,
    readonly targetFactory: (proxy: RpcProxy<T>) => any,
  ) { }

  /**
   *
   * @param connection
   */
  onConnection(connection: MessageConnection): void {
    const factory = new RpcProxyFactory<T>(this.path);
    const proxy = factory.createProxy();
    const target = this.targetFactory(proxy);

    factory.target = target;
    factory.listen(connection);
  }
}

/**
 * Factory for JSON-RPC proxy objects.
 *
 * A JSON-RPC proxy exposes the programmatic interface of an object through
 * JSON-RPC.  This allows remote programs to call methods of this objects by
 * sending JSON-RPC requests.  This takes place over a bi-directional stream,
 * where both ends can expose an object and both can call methods each other's
 * exposed object.
 *
 * For example, assuming we have an object of the following type on one end:
 *
 *     class Foo {
 *         bar(baz: number): number { return baz + 1 }
 *     }
 *
 * which we want to expose through a JSON-RPC interface.  We would do:
 *
 *     let target = new Foo()
 *     let factory = new JsonRpcProxyFactory<Foo>('/foo', target)
 *     factory.onConnection(connection)
 *
 * The party at the other end of the `connection`, in order to remotely call
 * methods on this object would do:
 *
 *     let factory = new JsonRpcProxyFactory<Foo>('/foo')
 *     factory.onConnection(connection)
 *     let proxy = factory.createProxy();
 *     let result = proxy.bar(42)
 *     // result is equal to 43
 *
 * One the wire, it would look like this:
 *
 *     --> {"jsonrpc": "2.0", "id": 0, "method": "bar", "params": {"baz": 42}}
 *     <-- {"jsonrpc": "2.0", "id": 0, "result": 43}
 *
 * Note that in the code of the caller, we didn't pass a target object to
 * JsonRpcProxyFactory, because we don't want/need to expose an object.
 * If we had passed a target object, the other side could've called methods on
 * it.
 *
 * @param <T> - The type of the object to expose to JSON-RPC.
 */
/**
 * 1、发送服务请求：负责创建target通讯代理，让用户能够向target发送服务请求
 * 2、监听及处理服务请求：负责处理服务请求，告知交给target的具体哪个方法处理该请求
 */
export class RpcProxyFactory<T extends object> implements ProxyHandler<T> {
  protected readonly onDidOpenConnectionEmitter = new Emitter<void>();
  protected readonly onDidCloseConnectionEmitter = new Emitter<void>();

  protected connectionPromiseResolve: (connection: MessageConnection) => void;
  protected connectionPromise: Promise<MessageConnection>;

  /**
   * Build a new JsonRpcProxyFactory.
   *
   * @param target - The object to expose to JSON-RPC methods calls.  If this
   *   is omitted, the proxy won't be able to handle requests, only send them.
   */
  constructor(public target?: any) {
    this.waitForConnection();
  }

  protected waitForConnection(): void {
    this.connectionPromise = new Promise(resolve =>
      this.connectionPromiseResolve = resolve,
    );
    this.connectionPromise.then((connection) => {
      connection.onClose(() =>
        this.onDidCloseConnectionEmitter.fire(undefined),
      );
      this.onDidOpenConnectionEmitter.fire(undefined)
    });
  }

  /**
   * Connect a MessageConnection to the factory.
   *
   * This connection will be used to send/receive JSON-RPC requests and
   * response.
   */
  listen(connection: MessageConnection) {
    if (this.target) {
      for (const prop in this.target) {
        if (typeof this.target[prop] === 'function') {
          connection.onRequest(prop, (...args) => this.onRequest(prop, ...args));
          connection.onNotification(prop, (...args) => this.onNotification(prop, ...args));
        }
      }
    }
    connection.onDispose(() => this.waitForConnection());
    connection.listen();
    this.connectionPromiseResolve(connection);
  }

  /**
   * Process an incoming JSON-RPC method call.
   *
   * onRequest is called when the JSON-RPC connection received a method call
   * request.  It calls the corresponding method on [[target]].
   *
   * The return value is a Promise object that is resolved with the return
   * value of the method call, if it is successful.  The promise is rejected
   * if the called method does not exist or if it throws.
   *
   * @returns A promise of the method call completion.
   */
  protected onRequest(method: string, ...args: any[]): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        const promise = this.target[method](...args) as Promise<any>
        promise
          .catch(err => reject(err))
          .then(result => resolve(result))
      }
      catch (err) {
        reject(err)
      }
    })
  }

  /**
   * Process an incoming JSON-RPC notification.
   *
   * Same as [[onRequest]], but called on incoming notifications rather than
   * methods calls.
   */
  protected onNotification(method: string, ...args: any[]): void {
    this.target[method](...args)
  }

  /**
   * Create a Proxy exposing the interface of an object of type T.  This Proxy
   * can be used to do JSON-RPC method calls on the remote target object as
   * if it was local.
   *
   * If `T` implements `JsonRpcServer` then a client is used as a target object for a remote target object.
   */
  createProxy(): RpcProxy<T> {
    const result = new Proxy<T>(this as any, this)
    return result as any
  }

  /**
   * Get a callable object that executes a JSON-RPC method call.
   *
   * Getting a property on the Proxy object returns a callable that, when
   * called, executes a JSON-RPC call.  The name of the property defines the
   * method to be called.  The callable takes a variable number of arguments,
   * which are passed in the JSON-RPC method call.
   *
   * For example, if you have a Proxy object:
   *
   *     let fooProxyFactory = JsonRpcProxyFactory<Foo>('/foo')
   *     let fooProxy = fooProxyFactory.createProxy()
   *
   * accessing `fooProxy.bar` will return a callable that, when called,
   * executes a JSON-RPC method call to method `bar`.  Therefore, doing
   * `fooProxy.bar()` will call the `bar` method on the remote Foo object.
   *
   * @param target - unused.
   * @param p - The property accessed on the Proxy object.
   * @param receiver - unused.
   * @returns A callable that executes the JSON-RPC call.
   */
  get(target: T, p: PropertyKey, _receiver: any): any {
    if (p === 'setClient') {
      return (client: any) => {
        this.target = client;
      }
    }
    if (p === 'onDidOpenConnection') {
      return this.onDidOpenConnectionEmitter.event;
    }
    if (p === 'onDidCloseConnection') {
      return this.onDidCloseConnectionEmitter.event;
    }
    const isNotify = this.isNotification(p)
    return (...args: any[]) => {
      return this.connectionPromise.then((connection) => {
        return new Promise((resolve, reject) => {
          try {
            if (isNotify) {
              connection.sendNotification(p.toString(), ...args)
              resolve(void 0);
            }
            else {
              const resultPromise = connection.sendRequest(p.toString(), ...args) as Promise<any>
              resultPromise
                .catch((err: any) => reject(err))
                .then((result: any) => {
                  resolve(result)
                })
            }
          }
          catch (err) {
            reject(err)
          }
        })
      })
    }
  }

  /**
   * Return whether the given property represents a notification.
   *
   * A property leads to a notification rather than a method call if its name
   * begins with `notifiy` or `on`.
   *
   * @param p - The property being called on the proxy.
   * @return Whether `p` represents a notification.
   */
  protected isNotification(p: PropertyKey): boolean {
    return p.toString().startsWith("notify") || p.toString().startsWith("on")
  }
}
