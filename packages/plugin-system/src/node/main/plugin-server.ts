import { Contribution, IServiceContainer, InjectableService, RpcConnectionHandler } from '@gepick/core/common';
import { ConnectionHandlerContribution, IConnectionHandlerContribution } from '@gepick/core/node';
import { IPluginClient, IPluginDeployerEntry, IPluginMetadata, IPluginServer as IPluginServerService } from '@gepick/plugin-system/common';
import { HostedPlugin, PluginReader } from '@gepick/plugin-system/node';
import { IPluginReader } from "./plugin-reader"
import { IHostedPlugin } from "./hosted-plugin"

export class PluginServer extends InjectableService implements IPluginServerService {
  private pluginsMetadata: IPluginMetadata[] = []

  constructor(
    @IPluginReader private readonly pluginReader: IPluginReader,
    @IHostedPlugin private readonly hostedPlugin: IHostedPlugin,
  ) {
    super();
  }

  getHostedPlugin = (): Promise<IPluginMetadata | undefined> => {
    const pluginMetadata = this.pluginReader.getPluginMetadata('')

    if (pluginMetadata) {
      this.hostedPlugin.runPlugin(pluginMetadata.model)
    }

    return Promise.resolve(pluginMetadata)
  }

  setClient(client: IPluginClient | undefined): void {
    this.hostedPlugin.setClient(client)
  }

  onMessage = (message: string): Promise<void> => {
    this.hostedPlugin.onMessage(message);
    return Promise.resolve();
  }

  deployPlugins = (pluginEntries: string[]) => {
    if (pluginEntries.length > 0) {
      this.hostedPlugin.runPluginServer()
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

export const IPluginServer = PluginServer.getServiceDecorator()

@Contribution(ConnectionHandlerContribution)
export class PluginServerConnectionHandler extends InjectableService implements IConnectionHandlerContribution {
  constructor(
    @IServiceContainer private readonly container: IServiceContainer,
  ) {
    super()
  }

  onConnectionHandlerConfigure() {
    return new RpcConnectionHandler("/services/plugin", (client) => {
      const pluginServer = this.container.get<IPluginServerService>(IPluginServer)
      pluginServer.setClient(client as any);

      return pluginServer;
    })
  }
}
