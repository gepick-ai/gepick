import { Contribution, IServiceContainer, InjectableService, RpcConnectionHandler } from '@gepick/core/common';
import { ConnectionHandlerContribution, IConnectionHandlerContribution } from '@gepick/core/node';
import { IPluginClient, IPluginDeployerEntry, IPluginMetadata, IPluginServer } from '@gepick/plugin-system/common';
import { IPluginReader } from "./plugin-reader"
import { IPluginHostManager } from "./plugin-host-manager"

export class PluginServer extends InjectableService implements IPluginServer {
  private pluginsMetadata: IPluginMetadata[] = []

  constructor(
    @IPluginReader private readonly pluginReader: IPluginReader,
    @IPluginHostManager private readonly pluginHostManager: IPluginHostManager,
  ) {
    super();
  }

  getHostedPlugin = (): Promise<IPluginMetadata | undefined> => {
    const pluginMetadata = this.pluginReader.getPluginMetadata('')

    if (pluginMetadata) {
      this.pluginHostManager.runPlugin(pluginMetadata.model)
    }

    return Promise.resolve(pluginMetadata)
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

  getDeployedFrontendMetadata = (): Promise<IPluginMetadata[]> => {
    return Promise.resolve([
      {
        source: "" as any,
        model: "" as any,
        lifecycle: "" as any,
      },
    ])
  };

  deployFrontendPlugins: (frontendPlugins: IPluginDeployerEntry[]) => Promise<void>;
  getDeployedBackendMetadata: () => Promise<IPluginMetadata[]>;
  deployBackendPlugins: (backendPlugins: IPluginDeployerEntry[]) => Promise<void>;
  isPluginValid: (uri: string) => Promise<boolean>;
  runHostedPluginInstance: (uri: string) => Promise<string>;
  terminateHostedPluginInstance: () => Promise<void>;
  isHostedTheiaRunning: () => Promise<boolean>;
  getHostedPluginInstanceURI: () => Promise<string>;
  override dispose: () => void;
}

@Contribution(ConnectionHandlerContribution)
export class PluginServerConnectionHandlerService extends InjectableService implements IConnectionHandlerContribution {
  constructor(
    @IServiceContainer private readonly container: IServiceContainer,
  ) {
    super()
  }

  createConnectionHandler() {
    return new RpcConnectionHandler("/services/plugin", (client) => {
      const pluginServer = this.container.get<IPluginServer>(PluginServer.getServiceId())
      pluginServer.setClient(client as any);

      return pluginServer;
    })
  }
}
