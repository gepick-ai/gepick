import path from "node:path"
import { InjectableService, createServiceDecorator } from "@gepick/core/common";
import { IFileService } from "@gepick/core/node"
import { IPluginStore, PluginType } from "./type";

export class PluginScanner extends InjectableService {

  constructor(
        @IFileService private readonly fileService: IFileService,
  ) {
    super()
  }

  async scanAllPlugins() {
    /**
     * 1.定义存放内置plugin的目录
     * 2.定义存放用户plugin的目录
     */
    const systemPluginStore: IPluginStore = {
      type: PluginType.System,
      entry: '/Users/jaylen/projects/gepick-plugin-system/plugins',
    }
    // const userPluginStore: IPluginStore = {
    //   type: PluginType.User,
    //   entry: '/Users/jaylen/.gepick/plugins',
    // }

    const pluginStores = [systemPluginStore]

    const installedPlugins = await Promise.all(pluginStores.map(async (store) => {
      return this.scanPlugins(store)
    }))

    return installedPlugins.flat()
  }

  async scanPlugins(pluginStore: IPluginStore) {
    const filenames = await this.fileService.readDir(pluginStore.entry)

    const pluginEntries = filenames.map((file) => {
      return path.resolve(pluginStore.entry, file)
    })

    const installedPlugins = await Promise.all(pluginEntries.map(async (pluginEntry) => {
      const manifest = await this.scanPluginManifest(pluginEntry)

      return {
        id: manifest.id,
        manifest,
        entry: pluginEntry,
        type: pluginStore.type,
      }
    }))

    return installedPlugins
  }

  async scanPluginManifest(pluginEntry: string) {
    const manifest = await this.fileService.readJson<any>(path.resolve(pluginEntry, 'package.json'))

    return {
      name: manifest.name,
      description: manifest.description,
      version: manifest.version,
      publisher: manifest.publisher,
      entry: path.resolve(pluginEntry, manifest.main),
      id: `${manifest.publisher}.${manifest.name}@${manifest.version}`,
    }
  }
}

export const IPluginScanner = createServiceDecorator<IPluginScanner>("PluginScanner")
export type IPluginScanner = PluginScanner;
