import { PluginHostContext } from '@gepick/plugin-system/common/plugin-api';
import { DisposableCollection, InjectableService, createServiceDecorator, toDisposable } from '@gepick/core/common';
import { IDeployedPlugin } from '../common/plugin-service';
import { PluginIdentifiers } from '../common/plugin-identifiers';
import { IMainThreadRpcService } from './main-thread-rpc';

class PluginContributions extends DisposableCollection {
  constructor(
    readonly plugin: IDeployedPlugin,
  ) {
    super();
  }

  state: PluginContributions.State = PluginContributions.State.INITIALIZING;
}

namespace PluginContributions {
  export enum State {
    INITIALIZING = 0,
    LOADING = 1,
    LOADED = 2,
    STARTING = 3,
    STARTED = 4,
  }
}

export const IPluginClient = createServiceDecorator<IPluginClient>("PluginClient");
export type IPluginClient = PluginClient;

export class PluginClient extends InjectableService {
  protected readonly idPluginContributionsMap = new Map<PluginIdentifiers.UnversionedId, PluginContributions>();
  protected installedPlugins: IDeployedPlugin[] = [];

  constructor(
    @IMainThreadRpcService private readonly mainThreadRpcService: IMainThreadRpcService,
  ) {
    super();
  }

  get plugins() {
    return this.installedPlugins;
  }

  async initialize(): Promise<void> {
    this.startPluginHostIfNeeded();
    const plugins = await this.syncPlugins();
    this.installedPlugins = plugins;
    this.startPlugins(plugins);
  }

  private async syncPlugins(): Promise<IDeployedPlugin[]> {
    const pluginServiceProxy = this.mainThreadRpcService.getPluginServiceProxy();
    const deployedPlugins = await pluginServiceProxy.getDeployedPlugins();

    return deployedPlugins;
  }

  private async startPlugins(plugins: IDeployedPlugin[]): Promise<void> {
    try {
      const pluginManagerExt = this.mainThreadRpcService.getRemoteServiceProxy(PluginHostContext.PluginManager);

      pluginManagerExt.$start(plugins);
    }
    catch (e) {
      console.error(`Failed to start plugins for plugin host`, e);
    }
  }

  private startPluginHostIfNeeded() {
    const pluginServiceProxy = this.mainThreadRpcService.getPluginServiceProxy();
    pluginServiceProxy.startPluginHostProcess();
  }
}
