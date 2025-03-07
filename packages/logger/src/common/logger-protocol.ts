import { JsonRpcServer } from '@gepick/core/common';

export const ILoggerServer = Symbol('ILoggerServer');

export const loggerPath = '/services/logger';

export interface ILoggerServer extends JsonRpcServer<ILoggerClient> {
  setLogLevel: (id: number, logLevel: number) => Promise<void>
  getLogLevel: (id: number) => Promise<number>
  log: (id: number, logLevel: number, message: string, params: any[]) => Promise<void>
  info: (message: string) => void
  warn: (message: string) => void
  child: (obj: object) => Promise<number>
}

export const ILoggerClient = Symbol('ILoggerClient');

export interface ILogLevelChangedEvent {
  oldLogLevel: number
  newLogLevel: number
}

export interface ILoggerClient {
  onLogLevelChanged: (event: ILogLevelChangedEvent) => void
}
