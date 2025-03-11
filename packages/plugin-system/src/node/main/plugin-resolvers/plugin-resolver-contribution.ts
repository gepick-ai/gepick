import { createContributionProviderDecorator } from '@gepick/core/common';
import { IPluginResolverContext } from '@gepick/plugin-system/common';

export const [PluginResolverContribution, IPluginResolverProvider] = createContributionProviderDecorator<IPluginResolverContribution>("PluginResolverContribution")
export interface IPluginResolverContribution {
  accept: (pluginSourceId: string) => boolean
  resolve: (pluginResolverContext: IPluginResolverContext) => Promise<void>
}
