import { Module, ServiceModule } from '@gepick/core/common';
import { PluginReader } from './plugin-reader';
import { PluginService, PluginServiceConnectionHandler } from './plugin-service';
import { PluginScanner } from './plugin-scanner';
import { GepickPluginStoreLocationHandler } from './plugin-storage-location/gepick-plugin-store-location-handler';
import { PluginDeployment } from './plugin-deployment';
import { PluginGithubScanner } from './plugin-scanner/plugin-github-scanner';
import { PluginHttpScanner } from './plugin-scanner/plugin-http-scanner';
import { PluginLocalScanner } from './plugin-scanner/plugin-local-scanner';
import { PluginHostProcessManager } from './plugin-host-process-manager';

@Module({
  services: [
    PluginService,
    PluginServiceConnectionHandler,
    PluginReader,
    PluginScanner,
    PluginDeployment,
    GepickPluginStoreLocationHandler,
    PluginGithubScanner,
    PluginHttpScanner,
    PluginLocalScanner,
    PluginHostProcessManager,
  ],
})
export class PluginMainModule extends ServiceModule {}
