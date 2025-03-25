import { Contribution, IServiceContainer, InjectableService, RpcConnectionHandler, createServiceDecorator } from '@gepick/core/common';
import { IApplicationContribution, IConnectionHandlerContribution, IMessagingService } from "@gepick/core/node";
import { IPluginClient, IPluginMetadata } from "../../common/plugin-protocol";
import { IInstalledPlugin } from "./type";
import { IPluginScanner } from "./plugin-scanner";
import { IPluginDeployment } from "./plugin-deployment";
import { IPluginHostProcessManager } from "./plugin-host-process-manager";

export const IPluginService = createServiceDecorator<IPluginService>("PluginService");
export type IPluginService = PluginService;

@Contribution(IConnectionHandlerContribution)
export class PluginServiceConnectionHandler extends InjectableService implements IConnectionHandlerContribution {
  constructor(
    @IServiceContainer private readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  onConfigureConnectionHandler(messagingService: IMessagingService) {
    messagingService.addHandler(new RpcConnectionHandler("/services/plugin", (client) => {
      const pluginHostManager = this.serviceContainer.get<IPluginService>(IPluginService);
      pluginHostManager.setClient(client as any);

      return pluginHostManager;
    }));
  }
}

@Contribution(IApplicationContribution)
export class PluginService extends InjectableService implements IApplicationContribution {
  private client: any;
  private installedPlugins = new Map<string, IInstalledPlugin>();

  constructor(
    @IPluginScanner private readonly pluginScanner: IPluginScanner,
    @IPluginDeployment private readonly pluginDeployment: IPluginDeployment,
    @IPluginHostProcessManager private readonly pluginHostProcessManager: IPluginHostProcessManager,

  ) {
    super();
  }

  onApplicationInit() {
    this.getInstalledPlugins();
    // this.startPluginHostProcess()
  }

  setClient(client: IPluginClient | undefined): void {
    if (client) {
      this.client = client;
    }
  }

  // =region PluginHostProcess=

  /**
   * 向plugin host process发消息
   */
  onMessage(message: string): Promise<void> {
    const pluginHostProcess = this.pluginHostProcessManager.getPluginHostProcess();
    if (pluginHostProcess) {
      pluginHostProcess.send(message);
    }

    return Promise.resolve();
  }

  /**
   * 启动plugin host process并准备随时从plugin host process收消息
   */
  async startPluginHostProcess() {
    await this.pluginHostProcessManager.startPluginHostProcess();

    const pluginHostProcess = this.pluginHostProcessManager.getPluginHostProcess();

    if (pluginHostProcess) {
      pluginHostProcess.on('message', (message: string) => {
        if (this.client) {
          this.client.onMessage(message);
        }
      });
    }

    return Promise.resolve();
  }

  /**
   * 关闭plugin host process
   */
  stopPluginHostProcess() {
    this.pluginHostProcessManager.stopPluginHostProcess();
  }

  // =endregion PluginHostProcess=

  async getInstalledPlugins() {
    let installedPlugins = Array.from(this.installedPlugins.values());

    if (installedPlugins.length === 0) {
      installedPlugins = await this.pluginScanner.scanAllPlugins();

      installedPlugins.forEach((plugin) => {
        this.installedPlugins.set(plugin.id, plugin);
      });
    }

    return installedPlugins;
  }

  getDeployedMetadata(): Promise<IPluginMetadata[]> {
    return Promise.resolve([
      {
        source: "" as any,
        model: "" as any,
        lifecycle: "" as any,
      },
    ]);
  }

  async getDeployedPluginIds(): Promise<any[]> {
    return this.pluginDeployment.getDeployedPluginIds();
  }

  async getUninstalledPluginIds(): Promise<any[]> {
    return Promise.resolve([]);
  }

  async getDeployedPlugins({ pluginIds }: { pluginIds: string[] }): Promise<any[]> {
    if (!pluginIds.length) {
      return [];
    }

    return this.pluginDeployment.getDeployedPlugins();
  }
}
