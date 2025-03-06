import * as cp from "node:child_process";
import path from 'node:path';
import { EXT, Emitter, IPluginClient, IPluginModel, RPCProtocol } from '@gepick/plugin-system/common';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
export class HostedPlugin {
  private cp: cp.ChildProcess | undefined;
  private client: IPluginClient

  setClient(client: IPluginClient | undefined): void {
    if (client) {
      this.client = client;
    }
  }

  runPlugin(plugin: IPluginModel): void {
    if (plugin.entryPoint.backend) {
      this.runPluginServer();
    }

    // eslint-disable-next-line no-console
    console.log("run plugin")

    this.cp = this.fork({
      serverName: "hosted-plugin",
      args: [],
    })

    // 当子进程接收到父进程发来的消息时，向plugin host发送过去
    this.cp.on('message', (message: string) => {
      if (this.client) {
        this.client.postMessage(message);
      }
    });
  }

  runPluginServer() {
    if (this.cp) {
      this.stopPluginServer()
    }

    this.cp = this.fork({
      serverName: "hosted-plugin",
      args: [],
    });

    // 监听子进程的message事件，将message传递给web那边的main端
    // 那么子进程一定会使用process.send发送消息
    this.cp.on('message', (message) => {
      if (this.client) {
        // HostedPluginClient是一个json rpc proxy
        // proxy发送json rpc请求，指定连接hostedServicePath的web端service hosted plugin client，要求执行其postMessage方法，并将message当作参数传递
        this.client.postMessage(message as string);
      }
    });
  }

  stopPluginServer() {
    const emitter = new Emitter();
    if (this.cp) {
      this.cp?.on('message', (message: any) => {
        emitter.fire(JSON.parse(message));
      });
      const rpc = new RPCProtocol({
        onMessage: emitter.event,
        send: (m: any) => {
          if (this.cp?.send) {
            this.cp?.send(JSON.stringify(m));
          }
        },
      });
      const hostedPluginManager = rpc.getProxy(EXT.PLUGIN_MANAGER);
      hostedPluginManager.$stopPlugin('').then(() => {
        this.cp?.kill();
      });
    }
  }

  fork(options: any): cp.ChildProcess {
    const forkOptions: cp.ForkOptions = {
      silent: true,
      execArgv: [
        "--import=./scripts/register.js",
        "--es-module-specifier-resolution=node",
      ],
      // 5th element MUST be 'overlapped' for it to work properly on Windows.
      // 'overlapped' works just like 'pipe' on non-Windows platforms.
      // See: https://nodejs.org/docs/latest-v14.x/api/child_process.html#child_process_options_stdio
      // Note: For some reason `@types/node` does not know about 'overlapped'.
      stdio: ['pipe', 'pipe', 'pipe', 'ipc', 'overlapped' as 'pipe'],
    }

    const inspectArgPrefix = `--${options.serverName}-inspect`;
    const inspectArg = process.argv.find(v => v.startsWith(inspectArgPrefix));
    if (inspectArg !== undefined) {
      forkOptions.execArgv = ['--nolazy', `--inspect${inspectArg.substr(inspectArgPrefix.length)}`];
    }

    const childProcess = cp.fork(path.resolve(__dirname, '../plugin-host/plugin-host-main'), options.args, forkOptions);

    return childProcess;
  }

  onMessage(message: string): void {
    if (this.cp) {
      this.cp.send(message);
    }
  }
}
