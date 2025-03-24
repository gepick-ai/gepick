import { Contribution, InjectableService } from '@gepick/core/common';
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginScanner } from './plugin-scanner-contribution';

@Contribution(IPluginScanner)
export class PluginGithubScanner extends InjectableService implements IPluginScanner {
  accept(pluginId: string): boolean {
    return pluginId.startsWith("github:");
  }

  resolve(_pluginResolverContext: IPluginScannerContext): Promise<void> {
    return Promise.resolve();
  }
}
