export const IPluginManagerExt = "PluginManagerExt"
export interface IPluginManagerExt {
  $initialize: (contextPath: string, pluginMetadata: any) => void
  $loadPlugin: (contextPath: string, plugin: any) => void
  $stopPlugin: (contextPath: string) => PromiseLike<void>
}
