import { createServiceDecorator } from "@gepick/core/common"

export const IPluginManagerExt = createServiceDecorator("PluginManagerExt")
export interface IPluginManagerExt {
  $start: (plugins: any[]) => Promise<void>
  $loadPlugin: (contextPath: string, plugin: any) => void
  $stopPlugin: (contextPath: string) => PromiseLike<void>
}
