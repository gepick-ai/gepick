import { Module, ServiceModule } from '@gepick/core/common';
import { PluginReader } from './plugin-reader';
import { PluginService, PluginServiceConnectionHandler } from './plugin-service';
import { GithubPluginResolver } from './plugin-resolver/github-plugin-resolver';
import { PluginScanner } from './plugin-scanner';

@Module({
  services: [
    PluginService,
    PluginServiceConnectionHandler,
    PluginReader,
    GithubPluginResolver,
    PluginScanner,
  ],
})
export class PluginMainModule extends ServiceModule {}
