import { promises as fs } from 'node:fs';
import { Contribution, IContributionProvider, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { IApplicationContribution } from "@gepick/core/node";
import { PluginIdentifiers } from '../../common/plugin-identifiers';
import { IDeployedPlugin, IPluginDeployerEntry, IPluginScannerContext, PluginType } from '../../common/plugin-protocol';
import { IPluginStorageLocationContext, IPluginStoreHandlerContribution, IPluginStoreHandlerProvider } from "./plugin-storage-location/plugin-store-handler-contribution";
import { IPluginScanner, IPluginScannerProvider } from "./plugin-scanner/plugin-scanner-contribution";
import { IPluginReader } from './plugin-reader';

export interface IPluginStore {
  location: string;
  type: PluginType;
}

class PluginEntry {
  private initPath: string;

  private currentPath: string;

  private map: Map<string, any>;

  private resolved: boolean;
  private acceptedTypes: any[];

  private changes: string[];

  private resolvedByName: string;

  private _type = PluginType.System;
  private _rootPath: string | undefined;

  constructor(readonly originId: string, readonly pluginId: string, initPath?: string) {
    this.map = new Map();
    this.changes = [];
    this.acceptedTypes = [];
    if (initPath) {
      this.currentPath = initPath;
      this.initPath = initPath;
      this.resolved = true;
    }
    else {
      this.resolved = false;
    }
  }

  id(): string {
    return this.pluginId;
  }

  originalPath(): string {
    return this.initPath;
  }

  path(): string {
    return this.currentPath;
  }

  getValue<T>(key: string): T {
    return this.map.get(key);
  }

  storeValue<T>(key: string, value: T): void {
    this.map.set(key, value);
  }

  updatePath(newPath: string, transformerName?: string): void {
    if (transformerName) {
      this.changes.push(transformerName);
    }
    this.currentPath = newPath;
  }

  getChanges(): string[] {
    return this.changes;
  }

  async isFile(): Promise<boolean> {
    try {
      const stat = await fs.stat(this.currentPath);
      return stat.isFile();
    }
    catch {
      return false;
    }
  }

  async isDirectory(): Promise<boolean> {
    try {
      const stat = await fs.stat(this.currentPath);
      return stat.isDirectory();
    }
    catch {
      return false;
    }
  }

  hasError(): boolean {
    throw new Error('Method not implemented.');
  }

  isResolved(): boolean {
    return this.resolved;
  }

  accept(...types: any[]): void {
    this.acceptedTypes = types;
  }

  isAccepted(...types: any[]): boolean {
    return types.some(type => this.acceptedTypes.includes(type));
  }

  setResolvedBy(name: string): void {
    this.resolvedByName = name;
  }

  resolvedBy(): string {
    return this.resolvedByName;
  }

  get type(): PluginType {
    return this._type;
  }

  set type(type: PluginType) {
    this._type = type;
  }

  get rootPath(): string {
    return this._rootPath ? this._rootPath : this.path();
  }

  set rootPath(rootPath: string) {
    this._rootPath = rootPath;
  }
}

class PluginScannerContext<T> implements IPluginScannerContext {
  private scannerName: string;
  private pluginLocations: any[];

  constructor(scanner: T, private readonly sourceId: string) {
    this.pluginLocations = [];
    this.scannerName = (scanner as any).constructor.name;
  }

  addPlugin(pluginId: string, path: string): void {
    const pluginEntry = new PluginEntry(this.sourceId, pluginId, path);
    pluginEntry.setResolvedBy(this.scannerName);
    this.pluginLocations.push(pluginEntry);
  }

  getPlugins(): any[] {
    return this.pluginLocations;
  }

  getOriginId(): string {
    return this.sourceId;
  }
}

@Contribution(IApplicationContribution)
export class PluginDeployment extends InjectableService implements IApplicationContribution {
  private readonly pluginIdDeployedLocationsMap = new Map<PluginIdentifiers.VersionedId, Set<string>>();
  /**
   * Managed plugin metadata backend entries.
   */
  private readonly idDeployedPluginMap = new Map<PluginIdentifiers.VersionedId, IDeployedPlugin>();

  constructor(
    @IPluginStoreHandlerProvider private readonly pluginStoreHandlerProvider: IContributionProvider<IPluginStoreHandlerContribution>,
    @IPluginScannerProvider private readonly pluginScannerProvider: IContributionProvider<IPluginScanner>,
    @IPluginReader private readonly pluginReader: IPluginReader,
  ) {
    super();
  }

  onApplicationInit() {
    this.startPluginDeployment();
  }

  /**
   * - scan all plugins
   */
  async startPluginDeployment(): Promise<void> {
    const pluginStorageLocations = await this.resolvePluginStorageLocations();
    const pluginEntries = await this.scanPlugins(pluginStorageLocations);

    this.deployPlugins(pluginEntries);
  }

  /**
   * 解析所有plugin可能存储位置:
   * - 项目仓库
   * - 系统本地磁盘
   * - github仓库
   * - http服务器
   */
  async resolvePluginStorageLocations() {
    const pluginStoreContext: IPluginStorageLocationContext = {
      systemPluginStoreLocations: ['local-dir:../../plugins'],
      userPluginStoreLocations: [],
    };

    for (const pluginStoreHandler of this.pluginStoreHandlerProvider.getContributions()) {
      pluginStoreHandler.registerPluginStoreLocation(pluginStoreContext);
    }

    const unresolvedSystemStores = pluginStoreContext.systemPluginStoreLocations.map(location => ({ location, type: PluginType.System }));
    const unresolvedUserStores = pluginStoreContext.userPluginStoreLocations.map(location => ({ location, type: PluginType.User }));

    return [...unresolvedSystemStores, ...unresolvedUserStores];
  }

  /**
   * 区分系统插件和用户插件，分别扫描系统插件和用户插件
   */
  async scanPlugins(pluginStores: IPluginStore[]) {
    const pluginScanners = this.pluginScannerProvider.getContributions();
    const pluginEntries: any[] = [];

    for (const pluginStore of pluginStores) {
      const scanner = pluginScanners.find(scanner => scanner.accept(pluginStore.location));

      const scannerContext = new PluginScannerContext(scanner, pluginStore.location);
      await scanner?.resolve(scannerContext);

      pluginEntries.push(...scannerContext.getPlugins());
    }
    return pluginEntries;
  }

  async deployPlugins(pluginEntries: any[]) {
    let successes = 0;

    for (const pluginEntry of pluginEntries) {
      const isDeployed = await this.deployPlugin(pluginEntry);

      if (isDeployed) {
        successes++;
      }
    }

    return successes;
  }

  async deployPlugin(pluginEntry: IPluginDeployerEntry): Promise<boolean> {
    const pluginPath = pluginEntry.path();
    let id;
    let success = true;

    try {
      const manifest = await this.pluginReader.readPackage(pluginPath);
      const metadata = await this.pluginReader.readMetadata(manifest);

      id = PluginIdentifiers.componentsToVersionedId(metadata.model);

      const deployedLocations = this.pluginIdDeployedLocationsMap.get(id) ?? new Set<string>();
      deployedLocations.add(pluginEntry.rootPath);
      this.pluginIdDeployedLocationsMap.set(id, deployedLocations);

      if (this.idDeployedPluginMap.has(id)) {
        // eslint-disable-next-line no-console
        console.info(`Skipped  plugin ${metadata.model.name} already deployed`);
        return true;
      }

      const { type } = pluginEntry;
      const deployedPlugin: IDeployedPlugin = { metadata, type };
      deployedPlugin.contributes = undefined;

      this.idDeployedPluginMap.set(id, deployedPlugin);

      // eslint-disable-next-line no-console
      console.info(`Deployed plugin "${id}" from "${pluginPath}"`);
    }
    catch (e) {
      console.error(`Failed to deploy plugin from '${pluginPath}' path`, e);
      return success = false;
    }
    finally {
      if (success && id) {
        this.markAsInstalled(id);
      }
    }

    return success;
  }

  protected markAsInstalled(id: PluginIdentifiers.VersionedId): void {
    // eslint-disable-next-line no-console
    console.log("mark as installed", id);
  }

  async getDeployedPluginIds() {
    return Array.from(this.idDeployedPluginMap.keys());
  }

  async getDeployedPlugins() {
    return Array.from(this.idDeployedPluginMap.values());
  }
}

export const IPluginDeployment = createServiceDecorator<IPluginDeployment>("PluginDeployment");
export type IPluginDeployment = PluginDeployment;
