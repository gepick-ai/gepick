import { IPluginResolverContext } from '@gepick/plugin-system/common';
import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginResolverContribution, PluginResolverContribution } from './plugin-resolver-contribution';

@Contribution(PluginResolverContribution)
export class GithubPluginResolver extends InjectableService implements IPluginResolverContribution {
  accept: (pluginSourceId: string) => boolean;
  resolve: (pluginResolverContext: IPluginResolverContext) => Promise<void>;
}
