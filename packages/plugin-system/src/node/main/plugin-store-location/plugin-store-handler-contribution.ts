import { createContribution } from "@gepick/core/common";

/**
 * Plugin文件存放的位置
 */
export interface IPluginStoreContext {
  readonly systemPluginStoreLocations: string[]
  readonly userPluginStoreLocations: string[]
}

export const [PluginStoreHandlerContribution, IPluginStoreHandlerProvider] = createContribution<IPluginStoreHandlerContribution>("PluginStoreContribution");
export interface IPluginStoreHandlerContribution {
  registerPluginStoreLocation: (pluginStoreLocationContext: IPluginStoreContext) => void
}
