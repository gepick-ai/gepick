import fs from "node:fs"
import path from "node:path"
import { IPluginMetadata, IPluginPackage } from '@gepick/plugin-system/common';
import { InjectableService } from '@gepick/core/common';

export class PluginReader extends InjectableService {
  private scanner: any;

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
}

export const IPluginReader = PluginReader.getServiceDecorator()
export type IPluginReader = PluginReader
