import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginScannerContribution, PluginScannerContribution } from './plugin-scanner-contribution';

@Contribution(PluginScannerContribution)
export class PluginGithubScanner extends InjectableService implements IPluginScannerContribution {
  accept(pluginId: string): boolean {
    return pluginId.startsWith("github:");
  }

  resolve(_pluginResolverContext: IPluginScannerContext): Promise<void> {
    return Promise.resolve()
  }
}
