import { IPluginManagerExt } from '@gepick/plugin-system/common';

export interface IPluginHost {
  initialize: (contextPath: string, pluginMetadata: any) => void

  loadPlugin: (contextPath: string, plugin: any) => void

  stopPlugins: (contextPath: string, pluginIds: string[]) => void
}

/**
 * 目前PluginManagerExt主要做的事情就是转发相关信息给plugin host处理
 */
export class PluginManagerExt implements IPluginManagerExt {
  private runningPluginIds: string[] = [];

  constructor(public readonly host: IPluginHost) { }

  /**
   * 利用plugin host initialize
   */
  $initialize(contextPath: string, pluginMetadata: any): void {
    this.host.initialize(contextPath, pluginMetadata);
  }

  /**
   * 利用plugin host loadPlugin
   */
  $loadPlugin(contextPath: string, plugin: any): void {
    this.runningPluginIds.push("id");
    this.host.loadPlugin(contextPath, plugin);
  };

  /**
   * 利用plugin host stopPlugins
   */
  $stopPlugin(contextPath: string): PromiseLike<void> {
    this.host.stopPlugins(contextPath, this.runningPluginIds)
    return Promise.resolve()
  };
}
