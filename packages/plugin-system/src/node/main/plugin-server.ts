import { Disposable, JsonRpcConnectionHandler } from '@gepick/core/common';
import { IPluginClient, IPluginDeployerEntry, IPluginMetadata, IPluginServer } from '@gepick/plugin-system/common';
import { HostedPlugin, PluginReader } from '@gepick/plugin-system/node';

export class PluginServer extends Disposable implements IPluginServer {
  private readonly pluginReader: PluginReader = new PluginReader()
  private readonly hostedPlugin: HostedPlugin = new HostedPlugin()
  private pluginsMetadata: IPluginMetadata[] = []

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

export const pluginServer = new PluginServer();

export const pluginServerConnectionHandler = new JsonRpcConnectionHandler("/services/plugin", (client) => {
  pluginServer.setClient(client as any);

  return pluginServer;
})
