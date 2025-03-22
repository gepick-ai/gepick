import fs from "node:fs"
import fsPromises from 'node:fs/promises';
import path from "node:path"
import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { FileUri, IFileService } from "@gepick/core/node";
import { IPluginMetadata, IPluginPackage } from "../../common/plugin-protocol";
import { PluginIdentifiers } from "../../common/plugin-identifiers";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/**
 * This interface describes a plugin model object, which is populated from package.json.
 */
export interface IPluginModel {
  id: string
  name: string
  publisher: string
  version: string
  displayName: string
  description: string
  engine: {
    type: 'gepick'
    version: string
  }
  entryPoint: string
  packageUri: string
  /**
   * @deprecated since 1.1.0 - because it lead to problems with getting a relative path
   * needed by Icon Themes to correctly load Fonts, use packageUri instead.
   */
  packagePath: string
  iconUrl?: string
  l10n?: string
  readmeUrl?: string
  licenseUrl?: string
}

export class PluginReader extends InjectableService {
  private scanner: any;

  constructor(
    @IFileService private readonly fileService: IFileService,
  ) {
    super();
  }

  getPluginMetadata(entry: string): IPluginMetadata | undefined {
    if (!entry.endsWith('/')) {
      entry += '/';
    }
    const packageJsonPath = `${entry}package.json`;
    if (!fs.existsSync(packageJsonPath)) {
      return undefined;
    }

    // eslint-disable-next-line ts/no-require-imports
    const plugin: IPluginPackage = require(packageJsonPath);
    const pluginMetadata = this.scanner.getPluginMetadata(plugin);
    if (pluginMetadata.model.entryPoint.backend) {
      pluginMetadata.model.entryPoint.backend = path.resolve(entry, pluginMetadata.model.entryPoint.backend);
    }

    return {
      source: "" as any,
      model: "" as any,
      lifecycle: "IPluginLifecycle" as any,
    };
  }

  async readPackage(pluginPath: string | undefined): Promise<any | undefined> {
    if (!pluginPath) {
      return undefined;
    }

    //  获取绝对的磁盘路径：比如/Users/work/.theia/deployedPlugins/christian-kohler.npm-intellisense-1.4.5/extension目录
    const resolvedPluginPath = await fsPromises.realpath(pluginPath);
    // 读取这个插件所在npm包的package.json的信息并添加一些新的信息
    const manifest = await this.fileService.readJson(path.join(resolvedPluginPath, 'package.json')) as any;
    // translate vscode builtins, as they are published with a prefix. See https://github.com/theia-ide/vscode-builtin-extensions/blob/master/src/republish.js#L50
    const built_prefix = '@gepick/';
    if (manifest && manifest.name && manifest.name.startsWith(built_prefix)) {
      manifest.name = manifest.name.substring(built_prefix.length);
    }
    manifest.publisher ??= PluginIdentifiers.UNPUBLISHED;

    if (!manifest) {
      return undefined;
    }
    manifest.packagePath = resolvedPluginPath;

    return manifest;
  }

  async readMetadata(pluginManifest: any) {
    const pluginMetadata = {
      host: "main",
      model: {
        packagePath: pluginManifest.packagePath,

        packageUri: FileUri.create(pluginManifest.packagePath).toString(),
        // see id definition: https://github.com/microsoft/vscode/blob/15916055fe0cb9411a5f36119b3b012458fe0a1d/src/vs/platform/extensions/common/extensions.ts#L167-L169
        id: `${(pluginManifest.publisher ?? "unpublished").toLowerCase()}.${pluginManifest.name.toLowerCase()}`,
        name: pluginManifest.name,
        publisher: pluginManifest.publisher ?? "unpublished",
        version: pluginManifest.version,
        displayName: pluginManifest.displayName,
        description: pluginManifest.description,
        engine: {
          type: "gepick",
          version: "v1.0.0",
        },
        entryPoint: pluginManifest.main,
        iconUrl: "",
        l10n: "",
        readmeUrl: './README.md',
        licenseUrl: './LICENSE',
      },
      lifecycle: {
        startMethod: 'activate',
        stopMethod: 'deactivate',
        frontendModuleName: "",
        frontendInitPath: 'plugin-vscode-init-fe.js',
        backendInitPath: path.join(__dirname, 'plugin-vscode-init'),
      },
      outOfSync: false,
      isUnderDevelopment: false,
    }

    return pluginMetadata;
  }
}

export const IPluginReader = createServiceDecorator<IPluginReader>("PluginReader")
export type IPluginReader = PluginReader
