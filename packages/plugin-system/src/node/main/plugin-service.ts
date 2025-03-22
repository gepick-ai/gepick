import * as cp from "node:child_process";
import path from 'node:path';
import { Contribution, Emitter, IServiceContainer, InjectableService, RpcConnectionHandler, createServiceDecorator } from '@gepick/core/common';
import { ApplicationContribution, ConnectionHandlerContribution, IApplicationContribution, IConnectionHandlerContribution } from "@gepick/core/node";
import { PluginHostContext } from "../../common/plugin-api/api-context";
import { RPCProtocol } from "../../common/rpc-protocol";
import { IPluginClient, IPluginMetadata } from "../../common/plugin-protocol";
import { IInstalledPlugin } from "./type";
import { IPluginScanner } from "./plugin-scanner";
import { IPluginDeployment } from "./plugin-deployment";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const IPluginService = createServiceDecorator<IPluginService>("PluginService")
export type IPluginService = PluginService

@Contribution(ConnectionHandlerContribution)
export class PluginServiceConnectionHandler extends InjectableService implements IConnectionHandlerContribution {
  constructor(
    @IServiceContainer private readonly serviceContainer: IServiceContainer,
  ) {
    super()
  }

  createConnectionHandler() {
    return new RpcConnectionHandler("/services/plugin", (client) => {
      const pluginHostManager = this.serviceContainer.get<IPluginService>(IPluginService)
      pluginHostManager.setClient(client as any);

      return pluginHostManager;
    })
  }
}

@Contribution(ApplicationContribution)
export class PluginService extends InjectableService implements IApplicationContribution {
  private client: any;
  private pluginHostProcess: cp.ChildProcess | undefined;
  private installedPlugins = new Map<string, IInstalledPlugin>();

  constructor(
    @IPluginScanner private readonly pluginScanner: IPluginScanner,
    @IPluginDeployment private readonly pluginDeployment: IPluginDeployment,
  ) {
    super()
  }

  onApplicationInit() {
    this.getInstalledPlugins()
    // this.startPluginHostProcess()
  }

  setClient(client: IPluginClient | undefined): void {
    if (client) {
      this.client = client;
    }
  }

  onMessage(message: string): Promise<void> {
    if (this.pluginHostProcess) {
      this.pluginHostProcess.send(message);
    }

    return Promise.resolve()
  }

  async getInstalledPlugins() {
    let installedPlugins = Array.from(this.installedPlugins.values())

    if (installedPlugins.length === 0) {
      installedPlugins = await this.pluginScanner.scanAllPlugins()

      installedPlugins.forEach((plugin) => {
        this.installedPlugins.set(plugin.id, plugin)
      })
    }

    return installedPlugins;
  }

  async startPluginHostProcess() {
    if (this.pluginHostProcess) {
      this.stopPluginHostProcess()
    }

    this.pluginHostProcess = this.fork({
      serverName: "hosted-plugin",
      args: [],
    });

    this.pluginHostProcess.on('message', (message: string) => {
      if (this.client) {
        this.client.onMessage(message);
      }
    })

    return Promise.resolve();
  }

  stopPluginHostProcess() {
    const emitter = new Emitter();
    if (this.pluginHostProcess) {
      this.pluginHostProcess?.on('message', (message: any) => {
        emitter.fire(JSON.parse(message));
      });
      const rpc = new RPCProtocol({
        onMessage: emitter.event as any,
        send: (m: any) => {
          if (this.pluginHostProcess?.send) {
            this.pluginHostProcess?.send(JSON.stringify(m));
          }
        },
      });
      const hostedPluginManager = rpc.getRemoteServiceProxy(PluginHostContext.PluginManager);
      hostedPluginManager.$stopPlugin('').then(() => {
        this.pluginHostProcess?.kill();
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

  getChildProcess() {
    return this.pluginHostProcess
  }

  deployPlugins(pluginEntries: string[]) {
    if (pluginEntries.length > 0) {
      this.startPluginHostProcess()
    }

    // pluginEntries.forEach((entry) => {
    //   this.pluginReader.getPluginMetadata(entry)
    // })

    return Promise.resolve();
  }

  getDeployedMetadata(): Promise<IPluginMetadata[]> {
    return Promise.resolve([
      {
        source: "" as any,
        model: "" as any,
        lifecycle: "" as any,
      },
    ])
  }

  async getDeployedPluginIds(): Promise<any[]> {
    return this.pluginDeployment.getDeployedPluginIds();
  }

  async getUninstalledPluginIds(): Promise<any[]> {
    return Promise.resolve([])
  }

  async getDeployedPlugins({ pluginIds }: { pluginIds: string[] }): Promise<any[]> {
    if (!pluginIds.length) {
      return [];
    }

    return this.pluginDeployment.getDeployedPlugins();
  }
}
