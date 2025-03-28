import { Module, ServiceModule } from '@gepick/core/common';
import { PluginService, PluginServiceConnectionHandler } from './plugin-service';
import { PluginHostProcessManager } from './plugin-host-process-manager';
import { GithubPluginScanner } from './plugin-scanner/github-plugin-scanner';
import { LocalPluginScanner } from './plugin-scanner/local-plugin-scanner';
import { PluginStorageScanService } from './plugin-scanner/plugin-storage-scan-service';
import { PluginDeploymentManager } from './plugin-deployment-manager';

@Module({
  services: [
    // =region PluginResolve=
    GithubPluginScanner,
    LocalPluginScanner,
    PluginStorageScanService,
    // =endregion PluginResolve=,
    PluginDeploymentManager,
    PluginHostProcessManager,
    PluginService,
    PluginServiceConnectionHandler,

  ],
})
export class PluginMainModule extends ServiceModule {}
