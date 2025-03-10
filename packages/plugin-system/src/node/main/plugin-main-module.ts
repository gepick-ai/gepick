import { Module, ServiceModule } from '@gepick/core/common';
import { PluginServer } from './plugin-server';
import { PluginReader } from './plugin-reader';
import { HostedPlugin } from './hosted-plugin';

@Module({
  services: [
    PluginServer,
    PluginReader,
    HostedPlugin,
  ],
})
export class PluginMainModule extends ServiceModule {}
