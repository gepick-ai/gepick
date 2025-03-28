import { promises as fs } from 'node:fs';
import path from "node:path";
import { Contribution, InjectableService } from '@gepick/core/common';
import { INodeRequestService } from '@gepick/core/node';
import { IPluginIdentifier } from '../../../common/plugin-service';
import { IPluginScanner, getTempDirPathAsync } from './plugin-scanner-contribution';

@Contribution(IPluginScanner)
export class GithubPluginScanner extends InjectableService implements IPluginScanner {
  private unpackedFolder = Promise.withResolvers<string>();

  constructor(
    @INodeRequestService private readonly nodeRequestService: INodeRequestService,
  ) {
    super();

    getTempDirPathAsync('github-remote').then(async (unpackedFolder) => {
      try {
        await fs.mkdir(unpackedFolder, { recursive: true });
        this.unpackedFolder.resolve(unpackedFolder);
      }
      catch (err) {
        this.unpackedFolder.reject(err);
      }
    });
  }

  get name(): string {
    return GithubPluginScanner.name;
  }

  canScan(pluginStorageLocation: string): boolean {
    return pluginStorageLocation.startsWith("github:");
  }

  async scan(pluginStorageLocation: string): Promise<IPluginIdentifier[]> {
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const extracted = /^github:(.*)\/(.*)\/(.*)$/m.exec(pluginStorageLocation);

    if (!extracted || extracted === null || extracted.length !== 4) {
      throw new Error(`Invalid extension ${pluginStorageLocation}`);
    }

    const orgName = extracted[1];
    const repoName = extracted[2];
    const file = extracted[3];
    const splitFile = file.split('@');
    let version;
    let filename: string;
    if (splitFile.length === 1) {
      filename = file;
      version = 'latest';
    }
    else {
      filename = splitFile[0];
      version = splitFile[1];
    }

    const unpackedFolder = await this.unpackedFolder.promise;
    const unpackedPath = path.resolve(unpackedFolder, path.basename(version + filename));

    try {
      await fs.access(unpackedPath);
      // use of cache. If file is already there use it directly
    }
    catch { }

    const url = `https://github.com/${orgName}/${repoName}/releases/download/${version}/${filename}`;

    const [error, response] = await this.nodeRequestService.request.get<string>(url);

    if (error || !response) {
      throw new Error(`Could not download the plugin from GitHub. URL: ${url}.`);
    }

    fs.writeFile(unpackedPath, response);

    return [{ id: '', sourcePath: '', packageJsonPath: '' }];
  }
}
