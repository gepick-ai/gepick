import { InjectableService } from "@gepick/core/common";

export interface IPluginService extends InjectableService {
  onMessage: (message: string) => Promise<void>
  getInstalledPlugins: () => Promise<any>
  startPluginHostProcess: () => Promise<void>
  deployPlugins: (pluginEntries: string[]) => void
  getDeployedMetadata: () => Promise<any[]>
}
