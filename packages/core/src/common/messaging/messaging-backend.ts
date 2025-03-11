import * as http from 'node:http';
import { IConnectionHandler } from "@gepick/core/common";
import { createServerWebSocketConnection } from "@gepick/core/node";

export class MessagingContribution {
  readonly handlers: IConnectionHandler[] = []

  onStart(server: http.Server): void {
    /**
     * server端的handler示例：
     *
     *  new JsonRpcConnectionHandler<ILoggerClient>(loggerPath, client => {
     *      const loggerServer = ctx.container.get<ILoggerServer>(ILoggerServer);
     *      loggerServer.setClient(client);
     *      return loggerServer;
     *  })
     *
     * server端的handler onConnection示例：
     *  class JsonRpcProxyHandler<T> {
     *      onConnection(connection: MessageConnection): void {
     *          const factory = new JsonRpcProxyFactory<T>(this.path);
     *          const proxy = factory.createProxy(); // create a proxy for the client
     *          factory.target = this.targetFactory(proxy); // 创建配合client proxy的server服务对象
     *          factory.listen(connection);
     *      }
     *  }
     *
     *
     * server端的factory listen示例：
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
     * server端的factory onRequest示例：
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
    for (const handler of this.handlers) {
      const path = handler.path;

      try {
        createServerWebSocketConnection({
          server,
          path,
        }, connection => handler.onConnection(connection));
      }
      catch (error) {
        console.error(error)
      }
    }
  }

  addHandler(handler: IConnectionHandler): void {
    this.handlers.push(handler);
  }
}
