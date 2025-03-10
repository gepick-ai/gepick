/* eslint-disable no-console */
import { Disposable, RpcConnectionHandler } from '@gepick/core/common';
import { ILoggerClient, ILoggerServer, loggerPath } from "@gepick/logger/common";

class ConsoleLogger extends Disposable implements ILoggerServer {
  /* Logger client to send notifications to.  */
  private client: ILoggerClient | undefined = undefined;

  error(message: string): void {
    console.log(message);
  }

  public readonly warn = (message: string): void => {
    console.log(`warning: ${message}`);
  }

  public readonly info = (message: string): void => {
    console.log(message);
  }

  log(id: number, logLevel: number, message: string, params: any[]): Promise<void> {
    console.log(`ID: ${id}, Level: ${logLevel}, Message: ${message}, Params: ${JSON.stringify(params)}`);
    return Promise.resolve();
  }

  /* Set the client to receive notifications on.  */
  setClient(client: ILoggerClient | undefined) {
    this.client = client;
  }

  async setLogLevel(id: number, logLevel: number): Promise<void> {
    console.log(`Set log level for ID: ${id} to ${logLevel}`);
  }

  async getLogLevel(id: number): Promise<number> {
    console.log(`Get log level for ID: ${id}`);
    return 0;
  }

  async child(obj: object): Promise<number> {
    console.log(`Create child logger with object: ${JSON.stringify(obj)}`);
    return 1; // Default child logger ID
  }

  override dispose(): void {
    console.log('Dispose logger');
  }
}

export const loggerConnectionHandler = new RpcConnectionHandler<ILoggerClient>(loggerPath, (client) => {
  const loggerServer = new ConsoleLogger();

  loggerServer.setClient(client);
  return loggerServer;
})
