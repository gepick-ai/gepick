/* eslint-disable no-console */
/* eslint-disable node/no-deprecated-api */
/* eslint-disable node/prefer-global/buffer */

import http from "node:http";
import url from "node:url";
import net from "node:net";
import ws from "ws";
import { ConsoleLogger } from "@gepick/core/node";
import { IWebSocket, MessageConnection, createWebSocketConnection } from "./vscode-ws-jsonrpc";

export interface IServerOptions {
  readonly server: http.Server
  readonly path?: string
  matches?: (request: http.IncomingMessage) => boolean
}

export function createServerWebSocketConnection(options: IServerOptions, onConnect: (connection: MessageConnection) => void): void {
  openJsonRpcSocket(options, (socket) => {
    const logger = new ConsoleLogger();
    const connection = createWebSocketConnection(socket, logger);
    onConnect(connection as any);
  });
}

export function openJsonRpcSocket(options: IServerOptions, onOpen: (socket: IWebSocket) => void): void {
  openSocket(options, (socket) => {
    const webSocket = toIWebSocket(socket);
    onOpen(webSocket);
  });
}

export interface OnOpen {
  (webSocket: ws, request: http.IncomingMessage, socket: net.Socket, head: Buffer): void
}

export function openSocket(options: IServerOptions, onOpen: OnOpen): void {
  const wss = new ws.Server({
    noServer: true,
    perMessageDeflate: false,
  });
  options.server.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    const pathname = request.url ? url.parse(request.url).pathname : undefined;
    if (options.path && pathname === options.path || options.matches && options.matches(request)) {
      wss.handleUpgrade(request, socket, head, (webSocket) => {
        if (webSocket.readyState === webSocket.OPEN) {
          onOpen(webSocket, request, socket, head);
        }
        else {
          webSocket.on('open', () => onOpen(webSocket, request, socket, head));
        }
      });
    }
  });
}

export function toIWebSocket(webSocket: ws) {
  return <IWebSocket>{
    send: content => webSocket.send(content, (error) => {
      if (error) {
        console.log(error);
      }
    }),
    onMessage: cb => webSocket.on('message', (message) => {
      cb(message)
    }),
    onError: cb => webSocket.on('error', (error) => {
      cb(error)
    }),
    onClose: cb => webSocket.on('close', (code, reason) => {
      cb(code, reason)
    }),
    dispose: () => {
      if (webSocket.readyState < ws.CLOSING) {
        webSocket.close();
      }
    },
  };
}
