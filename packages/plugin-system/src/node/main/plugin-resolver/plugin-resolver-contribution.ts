import { createContribution } from '@gepick/core/common';
import { IPluginResolverContext } from "../../../common/plugin-protocol"

export const [PluginResolverContribution, IPluginResolverProvider] = createContribution<IPluginResolverContribution>("PluginResolverContribution")
export interface IPluginResolverContribution {
  accept: (pluginSourceId: string) => boolean
  resolve: (pluginResolverContext: IPluginResolverContext) => Promise<void>
}
