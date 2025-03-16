import { Contribution, IServiceContainer, InjectableService, RpcConnectionHandler, createServiceDecorator } from "@gepick/core/common";
import { ApplicationContribution, ConnectionHandlerContribution, IApplicationContribution, IConnectionHandlerContribution } from "@gepick/core/node";
import { IPluginClient, IPluginMetadata } from "@gepick/plugin-system/common/plugin-protocol";
import { IPluginScanner } from "../plugin-scanner/plugin-scanner";
import { IInstalledPlugin } from "../type";
import { IPluginHostManager } from "../plugin-host-manager";

@Contribution(ApplicationContribution)
export class PluginManager extends InjectableService implements IApplicationContribution {
  private installedPlugins = new Map<string, IInstalledPlugin>()

  constructor(
        @IPluginScanner private readonly pluginScanner: IPluginScanner,
        @IPluginHostManager private readonly pluginHostManager: IPluginHostManager,
  ) {
    super()
  }

  onApplicationInit() {
    this.getInstalledPlugins()
    this.startPluginHostProcess()
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
    this.pluginHostManager.runPluginServer()
  }

  setClient(client: IPluginClient | undefined): void {
    this.pluginHostManager.setClient(client)
  }

  onMessage = (message: string): Promise<void> => {
    this.pluginHostManager.onMessage(message);
    return Promise.resolve();
  }

  deployPlugins = (pluginEntries: string[]) => {
    if (pluginEntries.length > 0) {
      this.pluginHostManager.runPluginServer()
    }

    // pluginEntries.forEach((entry) => {
    //   this.pluginReader.getPluginMetadata(entry)
    // })

    return Promise.resolve();
  }

  getDeployedMetadata = (): Promise< IPluginMetadata[] > => {
    return Promise.resolve([
      {
        source: "" as any,
        model: "" as any,
        lifecycle: "" as any,
      },
    ])
  }
}

export const IPluginManager = createServiceDecorator<PluginManager>("PluginManager")

@Contribution(ConnectionHandlerContribution)
export class PluginServerConnectionHandlerService extends InjectableService implements IConnectionHandlerContribution {
  constructor(
    @IServiceContainer private readonly container: IServiceContainer,
  ) {
    super()
  }

  createConnectionHandler() {
    return new RpcConnectionHandler("/services/plugin", (client) => {
      const pluginServer = this.container.get<PluginManager>(IPluginManager)
      pluginServer.setClient(client as any);

      return pluginServer;
    })
  }
}
