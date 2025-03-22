import { createContribution } from '@gepick/core/common';
import { IPluginScannerContext } from "../../../common/plugin-protocol"

export const [PluginScannerContribution, IPluginScannerProvider] = createContribution<IPluginScannerContribution>("PluginScannerContribution")
export interface IPluginScannerContribution {
  accept: (pluginSourceId: string) => boolean
  resolve: (pluginResolverContext: IPluginScannerContext) => Promise<void>
}
