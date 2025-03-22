import { IDeployedPlugin, IPluginMetadata } from '@gepick/plugin-system/common/plugin-protocol';
import { PluginHostContext } from '@gepick/plugin-system/common/plugin-api';
import { DisposableCollection, InjectableService, createServiceDecorator, toDisposable } from '@gepick/core/common';
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

export const IPluginClient = createServiceDecorator<IPluginClient>("PluginClient")
export type IPluginClient = PluginClient;

export class PluginClient extends InjectableService {
  protected readonly idPluginContributionsMap = new Map<PluginIdentifiers.UnversionedId, PluginContributions>();

  constructor(
    @IMainThreadRpcService private readonly mainThreadRpcService: IMainThreadRpcService,
  ) {
    super();
  }

  initialize() {
    this.startPluginHostIfNeeded();
    this.syncPlugins()
      .then(() => {
        const hostPluginContributionsMap = this.loadContributions();
        this.startPlugins(hostPluginContributionsMap);
      })
  }

  private async syncPlugins(): Promise<void> {
    let initialized = 0;

    try {
      const newPluginIds: PluginIdentifiers.VersionedId[] = [];
      const pluginServiceProxy = this.mainThreadRpcService.getPluginServiceProxy();
      const [deployedPluginIds] = await Promise.all([pluginServiceProxy.getDeployedPluginIds()]);

      for (const versionedPluginId of deployedPluginIds) {
        newPluginIds.push(versionedPluginId);
      }

      // eslint-disable-next-line no-console
      console.log("newPluginIds", newPluginIds)

      const deployedPlugins = await pluginServiceProxy.getDeployedPlugins({ pluginIds: newPluginIds })

      for (const plugin of deployedPlugins) {
        const pluginId = PluginIdentifiers.componentsToUnversionedId(plugin.metadata.model);
        const pluginContributions = new PluginContributions(plugin);
        this.idPluginContributionsMap.set(pluginId, pluginContributions);
        pluginContributions.push(toDisposable(() => this.idPluginContributionsMap.delete(pluginId)));
        initialized++;
      }
    }
    finally {
      if (initialized > 0) {
        // eslint-disable-next-line no-console
        console.info(`Sync of ${initialized}`)
      }
    }

    return Promise.resolve()
  }

  private startPluginHostIfNeeded() {
    const pluginServiceProxy = this.mainThreadRpcService.getPluginServiceProxy();
    pluginServiceProxy.startPluginHostProcess();
  }

  private async startPlugins(hostPluginContributionsMap: Map<string, PluginContributions[]>): Promise<void> {
    const thenable: Promise<void>[] = [];

    for (const [host, pluginContributions] of hostPluginContributionsMap) {
      const plugins = pluginContributions.map(contributions => contributions.plugin.metadata);

      const _startPlugin = async () => {
        try {
          const pluginManagerExt = this.mainThreadRpcService.getRemoteServiceProxy(PluginHostContext.PluginManager);

          pluginManagerExt.$start(plugins);
        }
        catch (e) {
          console.error(`Failed to start plugins for '${host}' host`, e);
        }
      }

      thenable.push(_startPlugin())
    }

    await Promise.all(thenable);
  }

  private loadContributions(): Map<string, PluginContributions[]> {
    const pluginContributionsArr = Array.from(this.idPluginContributionsMap.values());
    const hostPluginContributionsMap = new Map<string, PluginContributions[]> ();
    hostPluginContributionsMap.set('main', pluginContributionsArr);

    return hostPluginContributionsMap;
  }

  private loadPlugin(_pluginMetadata: any): void {
    // const pluginModel = pluginMetadata.model;
    // const pluginLifecycle = pluginMetadata.lifecycle

    // if (pluginModel.entryPoint.backend) {

    // 这里最终利用json-rpc发送给server的hosted-plugin-server
    // 告知是利用plugin manager ext的$initialize、$loadPlugin去执行相关任务
    const pluginManagerExt = this.mainThreadRpcService.getRemoteServiceProxy(PluginHostContext.PluginManager)
    // const plugin: IPlugin = {
    //   pluginPath: pluginModel.entryPoint.backend,
    //   model: pluginModel,
    //   lifecycle: pluginLifecycle,
    // }
    // const backendInitPath = pluginLifecycle.backendInitPath;

    const backendInitPath = "/Users/jaylen/Projects/gepick-plugin-system/.gepick/plugin-a/src/index.js"
    const pluginEntry = backendInitPath
    if (backendInitPath) {
      pluginManagerExt.$loadPlugin(pluginEntry, {
        pluginPath: pluginEntry,
        lifecycle: {
          startMethod: "activate",
        },
      })
    }
  }
}
