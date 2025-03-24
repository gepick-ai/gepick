import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginScanner } from './plugin-scanner-contribution';

@Contribution(IPluginScanner)
export class PluginHttpScanner extends InjectableService implements IPluginScanner {
  /**
   * Handle only the plugins that starts with http or https:
   */
  accept(pluginStoreLocation: string) {
    return /^https?:\/\/.*$/m.test(pluginStoreLocation);
  }

  resolve(_pluginResolverContext: IPluginScannerContext): Promise<void> {
    return Promise.resolve();
  }
}
