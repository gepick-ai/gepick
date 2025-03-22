import { InjectableService } from "@gepick/core/common";
import { PluginIdentifiers } from "./plugin-identifiers";

export interface IPluginService extends InjectableService {
  onMessage: (message: string) => Promise<void>
  getInstalledPlugins: () => Promise<any>
  startPluginHostProcess: () => Promise<void>
  deployPlugins: (pluginEntries: string[]) => void
  getDeployedMetadata: () => Promise<any[]>
  getDeployedPluginIds: () => Promise<PluginIdentifiers.VersionedId[]>
  getUninstalledPluginIds: () => Promise<readonly PluginIdentifiers.VersionedId[]>
  getDeployedPlugins: (params: { pluginIds: string[] }) => Promise<any[]>
}
