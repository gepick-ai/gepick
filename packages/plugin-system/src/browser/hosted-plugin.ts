import { IPluginMetadata } from '@gepick/plugin-system/common/plugin-protocol';
import { PluginHostContext } from '@gepick/plugin-system/common/plugin-api';
import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { IMainThreadRpcService } from './main-thread-rpc';

export const IHostedPluginService = createServiceDecorator<IHostedPluginService>("HostedPluginService")
export type IHostedPluginService = HostedPluginService;

export class HostedPluginService extends InjectableService {
  constructor(
    @IMainThreadRpcService private readonly mainThreadRpcService: IMainThreadRpcService,
  ) {
    super()
  }

  loadPlugins(): void {
    const backendMetadata = this.mainThreadRpcService.pluginHostManager.getDeployedMetadata();

    // 遍历启动所有plugins
    backendMetadata.then((pluginMetadata: IPluginMetadata[]) => {
      pluginMetadata.forEach(metadata => this.loadPlugin(metadata));
    });
  }

  loadPlugin(_pluginMetadata: any): void {
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
