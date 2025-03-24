import path from "node:path";
import { Contribution, InjectableService } from "@gepick/core/common";
import { FileUri, IFileService, URI } from "@gepick/core/node";
import { IPluginScannerContext } from '../../../common/plugin-protocol';
import { IPluginScanner } from './plugin-scanner-contribution';

@Contribution(IPluginScanner)
export class PluginLocalScanner extends InjectableService implements IPluginScanner {
  static scheme = 'local-dir';

  constructor(
    @IFileService private readonly fileService: IFileService,
  ) {
    super();
  }

  /**
   * Handle only the plugins that starts with http or https:
   */
  accept(pluginStoreLocation: string) {
    return pluginStoreLocation.startsWith(PluginLocalScanner.scheme);
  }

  async resolve(pluginResolverContext: IPluginScannerContext): Promise<void> {
    const localUri = new URI(pluginResolverContext.getOriginId());

    if (localUri.scheme !== PluginLocalScanner.scheme) {
      return Promise.resolve();
    }

    let fsPath = FileUri.fsPath(localUri);

    if (!path.isAbsolute(fsPath)) {
      fsPath = path.resolve(process.cwd(), fsPath);
    }

    if (!await this.fileService.pathExists(fsPath)) {
      console.warn(`The local plugin referenced by ${pluginResolverContext.getOriginId()} does not exist.`);
      return Promise.resolve();
    }

    if (fsPath) {
      const files = await this.fileService.readDir(fsPath);

      files.forEach(file =>
        pluginResolverContext.addPlugin(file, path.resolve(fsPath, file)),
      );
    }
  }
}
