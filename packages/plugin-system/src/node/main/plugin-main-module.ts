import { Module, ServiceModule } from '@gepick/core/common';
import { PluginServer, PluginServerConnectionHandlerService } from './plugin-server';
import { PluginReader } from './plugin-reader';
import { PluginHostManager } from './plugin-host-manager';
import { PluginDeployer } from './plugin-deployer';
import { GithubPluginResolver } from './plugin-resolvers/github-plugin-resolver';

@Module({
  services: [
    PluginDeployer,
    PluginServer,
    PluginReader,
    PluginHostManager,
    PluginServerConnectionHandlerService,
    GithubPluginResolver,
  ],
})
export class PluginMainModule extends ServiceModule {}
