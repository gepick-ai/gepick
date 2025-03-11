import { webSocketConnectionProvider } from '@gepick/core/browser';
import { IRPCProtocol, RPCProtocol } from '../../common/rpc-protocol';
import { IPluginMetadata, IPluginServer } from '../../common/plugin-protocol';
import { EXT } from '../../common/plugin-api';
import { setUpPluginApi } from './plugin-api-main/main-context';
import { HostedPluginWatcher } from './hosted-plugin-watcher';

export class HostedPlugin {
  private readonly hostedPluginWatcher = new HostedPluginWatcher()
  // json-rpc
  private readonly hostedPluginServer = webSocketConnectionProvider.createProxy<IPluginServer>('/services/plugin', this.hostedPluginWatcher.getHostedPluginClient())

  loadPlugins(): void {
    // this.hostedPluginServer.getHostedPlugin().then((pluginMetadata: IPluginMetadata | undefined) => {
    //   if (pluginMetadata) {
    //     this.loadPlugin(pluginMetadata)
    //   }
    // })

    const backendMetadata = this.hostedPluginServer.getDeployedMetadata();

    // 遍历启动所有plugins
    backendMetadata.then((pluginMetadata: IPluginMetadata[]) => {
      pluginMetadata.forEach(metadata => this.loadPlugin(metadata));
    });
  }

  loadPlugin(pluginMetadata: any): void {
    // const pluginModel = pluginMetadata.model;
    // const pluginLifecycle = pluginMetadata.lifecycle

    // if (pluginModel.entryPoint.backend) {
    const rpc = this.createServerRpc();
    setUpPluginApi(rpc)

    // 这里最终利用json-rpc发送给server的hosted-plugin-server
    // 告知是利用plugin manager ext的$initialize、$loadPlugin去执行相关任务
    const pluginManager = rpc.getProxy(EXT.PLUGIN_MANAGER)
    // const plugin: IPlugin = {
    //   pluginPath: pluginModel.entryPoint.backend,
    //   model: pluginModel,
    //   lifecycle: pluginLifecycle,
    // }
    // const backendInitPath = pluginLifecycle.backendInitPath;

    const backendInitPath = "/Users/work/Projects/demo/.gepick/plugin-a/src/index.js"
    const pluginEntry = backendInitPath
    if (backendInitPath) {
      pluginManager.$initialize(pluginEntry, pluginMetadata)
      pluginManager.$loadPlugin(pluginEntry, {
        pluginPath: pluginEntry,
        lifecycle: {
          startMethod: "activate",
        },
      })
    }

    // /Users/work/Projects/demo/.gepick/plugin-a/src/index.js
    // }
  }

  private createServerRpc(): IRPCProtocol {
    return new RPCProtocol({
      onMessage: this.hostedPluginWatcher.onPostMessageEvent,
      send: (message) => {
        this.hostedPluginServer.onMessage(JSON.stringify(message))
      },
    })
  }
}
