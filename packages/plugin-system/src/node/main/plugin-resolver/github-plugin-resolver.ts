import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginResolverContribution, PluginResolverContribution } from './plugin-resolver-contribution';

@Contribution(PluginResolverContribution)
export class GithubPluginResolver extends InjectableService implements IPluginResolverContribution {
  accept: (pluginSourceId: string) => boolean;
  resolve: (pluginResolverContext: IPluginScannerContext) => Promise<void>;
}
