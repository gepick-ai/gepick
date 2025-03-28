import { IContributionProvider, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { IPluginScanner, IPluginScannerProvider, IPluginSource, IPluginStorage, PluginSource } from "./plugin-scanner-contribution";

export const IPluginStorageScanService = createServiceDecorator<IPluginStorageScanService>("PluginStorageScanService");
/**
 * 我们的插件可能存储在不同的位置：
 * - 系统本地磁盘
 * - github仓库
 *
 * 那么用户可能会使用不同的方式描述自己的插件列表。比如：
 * ```typescript
 *  const localPlugins = [
 *      "local-dir:./plugins/plugin-a",
 *      "local-dir:./plugins/plugin-b"
 *  ];
 *  const githubPlugins = [
 *      "github://jaylenchen/plugin-a",
 *      "github://jaylenchen/plugin-b"
 *  ];
 * ```
 *
 * 于是为了解决这些情况，我们会设计出不同的plugin resolver，分别用来解析不同的plugin source并将其下载下来。
 */
export interface IPluginStorageScanService {
  getScannedPluginSources: () => Set<IPluginSource>;

  scanPluginStorages: (pluginStorages: IPluginStorage[]) => Promise<void>;

  scanPluginStorage: (pluginStorage: IPluginStorage) => Promise<void>;
}

export class PluginStorageScanService extends InjectableService implements IPluginStorageScanService {
  private scannedPluginSources = new Set<IPluginSource>();

  constructor(
    @IPluginScannerProvider private readonly pluginScannerProvider: IContributionProvider<IPluginScanner>,
  ) {
    super();
  }

  getScannedPluginSources(): Set<IPluginSource> {
    return this.scannedPluginSources;
  }

  async scanPluginStorages(pluginStorages: IPluginStorage[]): Promise<void> {
    await Promise.all(pluginStorages.map(storage => this.scanPluginStorage(storage)));
  }

  async scanPluginStorage(pluginStorage: IPluginStorage): Promise<void> {
    const pluginScanners = this.pluginScannerProvider.getContributions();

    const pluginScanner = pluginScanners.find(scanner => scanner.canScan(pluginStorage.location));

    if (pluginScanner) {
      const pluginSourceIdentifiers = await pluginScanner.scan(pluginStorage.location);

      pluginSourceIdentifiers.forEach((pluginIdentifier) => {
        this.scannedPluginSources.add(new PluginSource(pluginIdentifier, pluginStorage, pluginScanner.name));
      });
    }
  }
}
