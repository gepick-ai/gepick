import { Module, ServiceModule } from '@gepick/core/common';
import { PluginReader } from './plugin-reader';
import { PluginHostManager } from './plugin-host-manager';
import { PluginDeployer } from './plugin-deployer';
import { GithubPluginResolver } from './plugin-resolver/github-plugin-resolver';
import { PluginManager, PluginServerConnectionHandlerService } from './plugin-manager/plugin-manager';
import { PluginScanner } from './plugin-scanner/plugin-scanner';

@Module({
  services: [
    PluginDeployer,
    PluginReader,
    PluginHostManager,
    PluginServerConnectionHandlerService,
    GithubPluginResolver,
    PluginManager,
    PluginScanner,
  ],
})
export class PluginMainModule extends ServiceModule {}
