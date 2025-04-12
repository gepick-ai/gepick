import { Contribution, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { IApplicationContribution } from "@gepick/core/node";
import { IDeployedPlugin } from "../../common/plugin-service";
import { PluginType } from "../../common/type";
import { IPluginStorageScanService } from "./plugin-scanner/plugin-storage-scan-service";
import { IPluginSource, IPluginStorage } from "./plugin-scanner/plugin-scanner-contribution";

interface IPluginStorageLocationContext {
  readonly systemLocations: string[];
  readonly userLocations: string[];
}

export const IPluginDeploymentManager = createServiceDecorator<IPluginDeploymentManager>("PluginDeploymentManager");
export interface IPluginDeploymentManager {
  getDeployedPlugins: () => IDeployedPlugin[];
}

@Contribution(IApplicationContribution)
export class PluginDeploymentManager extends InjectableService implements IApplicationContribution {
  private deployedPlugins = new Map<string, IDeployedPlugin>();

  constructor(
    @IPluginStorageScanService private readonly pluginStorageScanService: IPluginStorageScanService,
  ) {
    super();
  }

  onApplicationInit() {
    this.deployPlugins();
  }

  async deployPlugins(): Promise<void> {
    const pluginStorages = await this.resolvePluginStorageLocations();

    await this.pluginStorageScanService.scanPluginStorages(pluginStorages);

    const scannedPluginSources = this.pluginStorageScanService.getScannedPluginSources();

    let successes = 0;

    for (const pluginSource of scannedPluginSources) {
      try {
        const isDeployed = await this.deployPlugin(pluginSource);

        if (isDeployed) {
          successes++;
        }
      }
      catch {}
    }

    // eslint-disable-next-line no-console
    console.log(`Successfully deployed ${successes > 1 ? `${successes} plugins` : `${successes} plugin`}.`);
  }

  async deployPlugin(pluginSource: IPluginSource): Promise<boolean> {
    let success = true;

    const manifest = await pluginSource.getPluginManifest();

    if (!manifest) {
      console.error(`Failed to read plugin manifest from '${pluginSource.getPluginIdentifier().sourcePath}'`);
      return success = false;
    }

    const contributions = await pluginSource.getPluginContributions();
    const model = await pluginSource.getPluginModel();

    const deployedPlugin: IDeployedPlugin = {
      contributions,
      model,
    };

    this.deployedPlugins.set(pluginSource.getPluginIdentifier().id, deployedPlugin);

    return success;
  }

  async resolvePluginStorageLocations(): Promise<IPluginStorage[]> {
    const pluginStorageLocationContext: IPluginStorageLocationContext = {
      systemLocations: ['local-dir:../../plugins'],
      userLocations: ['local-dir:/Users/jaylen/.gepick/plugins'],
    };

    return [
      ...pluginStorageLocationContext.systemLocations.map(location => ({ location, type: PluginType.System })),
      ...pluginStorageLocationContext.userLocations.map(location => ({ location, type: PluginType.User })),
    ];
  }

  getDeployedPlugins(): IDeployedPlugin[] {
    return Array.from(this.deployedPlugins.values());
  }
}
