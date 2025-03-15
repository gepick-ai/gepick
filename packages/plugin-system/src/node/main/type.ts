export enum PluginType {
  System,
  User,
}

export interface IPluginStore {
  type: PluginType
  entry: string
}

export interface IPluginManifest {
  /**
   * plugin名字
   */
  name: string

  /**
   * plugin描述信息
   */
  description: string

  /**
   * plugin版本
   */
  version: string

  /**
   * plugin发布者
   */
  publisher: string

  /**
   * plugin入口
   */
  entry: string

  /**
   * plugin id
   */
  id: string
}

export interface IInstalledPlugin {
  id: string
  manifest: IPluginManifest
  entry: string
  type: PluginType
}
