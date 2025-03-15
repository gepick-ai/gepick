import { createRequire } from 'module';
import { IServiceContainer, InjectableService } from '@gepick/core/common';
import { IPluginManagerExt } from '../../../common/plugin-api/plugin-manager';
import { setupPluginApi } from '../plugin-host-context';

export interface IPluginHost {
  initialize: (contextPath: string, pluginMetadata: any) => void

  loadPlugin: (contextPath: string, plugin: any) => void

  stopPlugins: (contextPath: string, pluginIds: string[]) => void
}

/**
 * 目前PluginManagerExt主要做的事情就是转发相关信息给plugin host处理
 */
export class PluginManagerExt extends InjectableService implements IPluginManagerExt {
  private plugins = new Map<string, () => void>();
  private runningPluginIds: string[] = [];

  constructor(
    @IServiceContainer private readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  /**
   * 利用plugin host initialize
   */
  $initialize(_contextPath: string, _pluginMetadata: any): void {
    const pluginAPI = setupPluginApi(this.serviceContainer);
    const require = createRequire(import.meta.url);
    const NODE_MODULE_NAMES = ['@gepick/plugin-api'];
    const module = require('module');

    // add theia object as module into npm cache
    NODE_MODULE_NAMES.forEach((moduleName) => {
      require.cache[moduleName] = {
        id: moduleName,
        filename: moduleName,
        loaded: true,
        exports: pluginAPI,
      } as any;
    });

    // save original resolve method
    const internalResolve = module._resolveFilename;

    // if we try to resolve theia module, return the filename entry to use cache.
    module._resolveFilename = (request: string, parent: any) => {
      if (NODE_MODULE_NAMES.includes(request)) {
        return request;
      }
      const retVal = internalResolve(request, parent);
      return retVal;
    };
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
