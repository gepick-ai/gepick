import { Contribution, InjectableService } from "@gepick/core/common";
import { IPluginManagerExt } from '../../../common/plugin-api/plugin-manager';
import { ILocalServiceContribution, LocalServiceContribution } from "../../../common/rpc-protocol";
import { IPluginHostRpcService } from '../plugin-host-rpc';
import { PluginHostContext } from "../../../common/plugin-api/api-context";

export interface IPluginHost {
  initialize: (contextPath: string, pluginMetadata: any) => void

  loadPlugin: (contextPath: string, plugin: any) => void

  stopPlugins: (contextPath: string, pluginIds: string[]) => void
}
interface IPluginModule {
  activate?: () => Promise<void>
  deactivate?: () => void
}
export class ActivatedPlugin {
  constructor(
    public readonly module: IPluginModule,
  ) {}

  deactivate() {
    this.module.deactivate?.()
  }
}

@Contribution(LocalServiceContribution)
export class PluginManagerExt extends InjectableService implements IPluginManagerExt, ILocalServiceContribution {
  private plugins = new Map<string, () => void>();
  private runningPluginIds: string[] = [];

  onRpcServiceInit(pluginHostRpcService: IPluginHostRpcService) {
    pluginHostRpcService.setLocalService(PluginHostContext.PluginManager, this)
  }

  /**
   * 利用plugin host loadPlugin
   */
  async $loadPlugin(contextPath: string, plugin: any): Promise<void> {
    this.runningPluginIds.push("id");
    try {
      // debug
      plugin.pluginPath = "/Users/work/Projects/gepick-plugin-system/.gepick/plugin-a/src/index.js"

      const pluginModule = await import(plugin.pluginPath);
      const pluginMain = pluginModule.default || pluginModule

      // ===startPlugin(plugin, pluginMain, plugins) block-start

      // if (typeof pluginMain[plugin.lifecycle.startMethod] === 'function') {
      pluginMain['activate' as any].apply(globalThis, []);
      // }
      // else {
      //   console.log('there is no doStart method on plugin');
      // }

      // if (typeof pluginMain[plugin.lifecycle.stopMethod] === 'function') {
      //   const pluginId = getPluginId(plugin.model);
      //   plugins.set(pluginId, pluginMain[plugin.lifecycle.stopMethod]);
      // }

      // ===startPlugin(plugin, pluginMain, plugins) block-end
    }
    catch (e: any) {
      console.error(e.stack);
    }
  };

  /**
   * 利用plugin host stopPlugins
   */
  $stopPlugin(_contextPath: string): PromiseLike<void> {
    this.runningPluginIds.forEach((pluginId) => {
      const stopPluginMethod = this.plugins.get(pluginId);
      if (stopPluginMethod) {
        stopPluginMethod();
        this.plugins.delete(pluginId);
      }
    });
    return Promise.resolve()
  };
}
