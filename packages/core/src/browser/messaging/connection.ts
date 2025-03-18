import ReconnectingWebSocket from 'reconnecting-websocket';
import { ConsoleLogger, IConnectionHandler, RpcProxy, RpcProxyFactory, listen as doListen } from "@gepick/core/common";
import { Endpoint } from "@gepick/core/browser";

export interface WebSocketOptions {
  /**
   * True by default.
   */
  reconnecting?: boolean
}

// Webscoket前端连接提供者

export class WebSocketConnectionProvider {
  /**
   * Create a proxy object to remote interface of T type
   * over a web socket connection for the given path.
   *
   * An optional target can be provided to handle
   * notifications and requests from a remote side.
   */
  createProxy<T extends object>(path: string, target?: object, options?: WebSocketOptions): RpcProxy<T> {
    const factory = new RpcProxyFactory<T>(target);

    // 创建一个connection handler对象
    // 这个地方跟server端稍稍不同，server端是直接通过JsonRpcConnectionHandler创建一个handler对象,而这里直接构造一个handler对象
    // 因为这里提前知道了path和factory，所以直接构造一个handler对象，而server端是通过JsonRpcConnectionHandler构造handler对象，内部逻辑间接创建了factory对象
    // client先把factory创建出来，再构造handler对象
    // server端在构造handler对象的逻辑里，会创建factory对象
    /**
     *
     * client端的factory listen示例：
     *
     *
     * class JsonRpcProxyFactory<T> {
     *  listen(connection: MessageConnection) {
     *       if (this.target) {
     *          for (let prop in this.target) {
     *               if (typeof this.target[prop] === 'function') {
     *                  connection.onRequest(prop, (...args) => this.onRequest(prop, ...args));
     *                 connection.onNotification(prop, (...args) => this.onNotification(prop, ...args));
     *               }
     *          }
     *       }
     *
     *       connection.onDispose(() => this.waitForConnection());
     *       connection.listen();
     *       this.connectionPromiseResolve(connection);
     *   }
     * }
     *
     * connection其实已经被vscode的jsonrpc库封装了，这里的connection是一个MessageConnection对象，
     * 该对象的onRequest和onNotification方法是由vscode-jsonrpc库提供的，用于处理客户端的请求和通知。
     * 只不过，这里在onRequest的时候，转而让JsonRpcProxyFactory的onRequest处理。
     *
     *
     * client端的factory onRequest示例：
     *
     * class JsonRpcProxyFactory<T> {
     *    protected onRequest(method: string, ...args: any[]): Promise<any> {
     *        return new Promise<any>((resolve, reject) => {
     *            try {
     *                let promise = this.target[method](...args) as Promise<any>
     *                promise
     *                  .catch(err => reject(err))
     *                  .then(result => resolve(result))
     *            } catch (err) {
     *                reject(err)
     *            }
     *      })
     *    }
     * }
     *
     * onRequest方法是用于处理客户端的请求的，这里的this.target是一个server服务对象，这个server服务对象
     * 其实就是将相关的方法异步执行起来。
     *
     */
    const handler: IConnectionHandler = {
      path,
      onConnection: c => factory.listen(c),
    }

    // 为当前path创建一个websocket连接
    const url = this.createWebSocketUrl(handler.path)
    const webSocket = this.createWebSocket(url, options);
    const logger = this.createLogger();

    webSocket.onerror = function (error: Event) {
      logger.error(`${url}: ${(error as any).message}`)
    }

    doListen({
      webSocket,
      onConnection: (handler.onConnection.bind(handler)) as any,
      logger,
    });

    // 类似于server端也是返回一个代理对象，它是一个JsonRpcProxy对象
    return factory.createProxy();
  }

  /**
   * Install a connection handler for the given path.
   */
  listen(handler: IConnectionHandler, options?: WebSocketOptions): void {
    const url = this.createWebSocketUrl(handler.path);
    const webSocket = this.createWebSocket(url, options);

    const logger = this.createLogger();
    webSocket.onerror = function (error: Event) {
      logger.error(`${error}`)
    }
    doListen({
      webSocket,
      onConnection: c => handler.onConnection(c as any),
      logger,
    });
  }

  protected createLogger() {
    return new ConsoleLogger();
  }

  /**
   * Creates a websocket URL to the current location
   */
  createWebSocketUrl(path: string): string {
    const endpoint = new Endpoint({ path })
    return endpoint.getWebSocketUrl().toString()
  }

  /**
   * Creates a web socket for the given url
   */
  createWebSocket(url: string, options?: WebSocketOptions): WebSocket {
    if (options === undefined || options.reconnecting) {
      const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 100000,
        maxRetries: Infinity,
        debug: false,
      };
      return new ReconnectingWebSocket(url, undefined, socketOptions) as any;
    }
    return new WebSocket(url);
  }
}
