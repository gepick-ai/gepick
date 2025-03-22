import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginScannerContribution, PluginScannerContribution } from './plugin-scanner-contribution';

@Contribution(PluginScannerContribution)
export class PluginHttpScanner extends InjectableService implements IPluginScannerContribution {
  /**
   * Handle only the plugins that starts with http or https:
   */
  accept(pluginStoreLocation: string) {
    return /^https?:\/\/.*$/m.test(pluginStoreLocation);
  }

  resolve(_pluginResolverContext: IPluginScannerContext): Promise<void> {
    return Promise.resolve()
  }
}
