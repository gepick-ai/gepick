import { MessageConnection } from "./vscode-ws-jsonrpc";

export const IConnectionHandler = Symbol.for('ConnectionHandler');

export interface IConnectionHandler {
  readonly path: string
  onConnection: (connection: MessageConnection) => void
}
