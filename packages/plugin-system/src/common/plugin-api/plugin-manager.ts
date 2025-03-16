import { createServiceDecorator } from "@gepick/core/common"

export const IPluginManagerExt = createServiceDecorator("PluginManagerExt")
export interface IPluginManagerExt {
  $initialize: (contextPath: string, pluginMetadata: any) => void
  $loadPlugin: (contextPath: string, plugin: any) => void
  $stopPlugin: (contextPath: string) => PromiseLike<void>
}
