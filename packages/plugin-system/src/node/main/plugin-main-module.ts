import { Module, ServiceModule } from '@gepick/core/common';
import { PluginServer, PluginServerConnectionHandler } from './plugin-server';
import { PluginReader } from './plugin-reader';
import { PluginHostManager } from './plugin-host-manager';
import { PluginDeployer } from './plugin-deployer';

@Module({
  services: [
    PluginDeployer,
    PluginServer,
    PluginReader,
    PluginHostManager,
    PluginServerConnectionHandler,
  ],
})
export class PluginMainModule extends ServiceModule {}
