import { Module, ServiceModule } from '@gepick/core/common';
import { PluginServer, PluginServerConnectionHandler } from './plugin-server';
import { PluginReader } from './plugin-reader';
import { HostedPlugin } from './hosted-plugin';
import { PluginDeploymentService } from './plugin-deployment-service';

@Module({
  services: [
    PluginServer,
    PluginReader,
    HostedPlugin,
    PluginDeploymentService,
    PluginServerConnectionHandler,
  ],
})
export class PluginMainModule extends ServiceModule {}
