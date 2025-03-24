import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginResolver } from './plugin-resolver-contribution';

@Contribution(IPluginResolver)
export class GithubPluginResolver extends InjectableService implements IPluginResolver {
  accept: (pluginSourceId: string) => boolean;
  resolve: (pluginResolverContext: IPluginScannerContext) => Promise<void>;
}
