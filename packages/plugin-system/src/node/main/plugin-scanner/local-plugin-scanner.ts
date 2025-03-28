import path from 'node:path';
import { Contribution, InjectableService } from '@gepick/core/common';
import { FileUri, IFileService, URI } from '@gepick/core/node';
import { IPluginIdentifier } from '../../../common/plugin-service';
import { IPluginScanner } from './plugin-scanner-contribution';

@Contribution(IPluginScanner)
export class LocalPluginScanner extends InjectableService implements IPluginScanner {
  constructor(
    @IFileService private readonly fileService: IFileService,
  ) {
    super();
  }

  get name(): string {
    return LocalPluginScanner.name;
  }

  canScan(pluginStorageLocation: string): boolean {
    return pluginStorageLocation.startsWith('local-dir');
  }

  async scan(pluginStorageLocation: string): Promise<IPluginIdentifier[]> {
    const localUri = new URI(pluginStorageLocation);

    if (localUri.scheme !== 'local-dir') {
      return [];
    }

    let fsPath = FileUri.fsPath(localUri);
    if (!path.isAbsolute(fsPath)) {
      fsPath = path.resolve(process.cwd(), fsPath);
    }

    if (!await this.fileService.pathExists(fsPath)) {
      console.warn(`The local plugin referenced by ${pluginStorageLocation} does not exist.`);
    }

    if (fsPath) {
      const files = await this.fileService.readDir(fsPath);

      return files.map(file => ({
        id: file,
        sourcePath: path.resolve(fsPath, file),
        packageJsonPath: path.resolve(fsPath, file, 'package.json'),
      }));
    }

    return [];
  }
}
