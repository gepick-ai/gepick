import { Module, ServiceModule } from '@gepick/core/common';
import { PluginReader } from './plugin-reader';
import { PluginHostConnectionHandlerService, PluginHostManager } from './plugin-host-manager';
import { GithubPluginResolver } from './plugin-resolver/github-plugin-resolver';
import { PluginScanner } from './plugin-scanner';

@Module({
  services: [
    PluginHostManager,
    PluginHostConnectionHandlerService,
    PluginReader,
    GithubPluginResolver,
    PluginScanner,
  ],
})
export class PluginMainModule extends ServiceModule {}
