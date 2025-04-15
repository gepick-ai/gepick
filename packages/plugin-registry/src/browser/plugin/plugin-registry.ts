import { CancellationToken, CancellationTokenSource, Emitter, InjectableService, PostConstruct, createServiceDecorator, pDebounce } from "@gepick/core/common";
import { DOMPurify, markdownit, messagingService } from "@gepick/core/browser";
import { IPluginSearchModel } from "../search";
import { mockVSXDatas } from "../vscode-util";
import { IPlugin, IPluginFactory, PluginOptions } from "./plugin";

export class PluginRegistry extends InjectableService {
  protected initialized: Promise<void>;
  protected searchCancellationTokenSource = new CancellationTokenSource();
  protected readonly plugins = new Map<string, any>();
  protected _installed = new Set<string>();
  protected _recommended = new Set<string>();
  protected _searchResult = new Set<string>();
  protected _searchError?: string;

  protected readonly _onDidChange = new Emitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor(
    @IPluginSearchModel protected readonly pluginSearchModel: IPluginSearchModel,
    @IPluginFactory protected readonly pluginFactory: IPluginFactory,
  ) {
    super();
  }

  get installed(): IterableIterator<string> {
    return this._installed.values();
  }

  get searchError(): string | undefined {
    return this._searchError;
  }

  get searchResult(): IterableIterator<string> {
    return this._searchResult.values();
  }

  @PostConstruct()
  protected init(): void {
    this.initialized = this.doInit().catch(console.error);
  }

  protected async doInit(): Promise<void> {
    await Promise.all([
      this.initInstalled(),
      this.initSearchResult(),
    ]);
  }

  protected async initInstalled(): Promise<void> {
    try {
      await this.updateInstalled();
    }
    catch (e) {
      console.error(e);
    }
  }

  protected async initSearchResult(): Promise<void> {
    this.pluginSearchModel.onDidChangeQuery(() => this.updateSearchResult());
    try {
      await this.updateSearchResult();
    }
    catch (e) {
      console.error(e);
    }
  }

  isInstalled(id: string): boolean {
    return this._installed.has(id);
  }

  getPlugin(id: string): any | undefined {
    return this.plugins.get(id);
  }

  protected setPlugin(id: string) {
    let plugin = this.plugins.get(id);
    if (!plugin) {
      plugin = this.pluginFactory.createPlugin(new PluginOptions(id));
      this.plugins.set(id, plugin);
    }
    return plugin;
  }

  protected async updateInstalled(): Promise<void> {
    const prevInstalled = this._installed;
    return this.doChange(async () => {
      // const plugins = this.pluginClient.plugins;
      const currInstalled = new Set<string>();
      const refreshing = [];

      for (const plugin of mockVSXDatas) {
        const id = plugin.id ?? plugin.model?.id;
        const extension = this.setPlugin(id);
        currInstalled.add(extension.id);
        refreshing.push(this.refresh(plugin));
      }

      const installed = new Set([...prevInstalled, ...currInstalled]);
      const installedSorted = Array.from(installed).sort((a, b) => this.comparePlugins(a, b));

      this._installed = new Set(installedSorted.values());
      await Promise.all(refreshing);
    });
  }

  resolve(id: string): Promise<IPlugin> {
    const readmes = [
      '/Users/jaylen/.theia/deployedPlugins/dbaeumer.vscode-eslint-3.0.10/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/dracula-theme.theme-dracula-2.25.1/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/editorconfig.editorconfig-0.17.2/extension/readme.md',
      '/Users/jaylen/.theia/deployedPlugins/ms-vscode.vscode-github-issue-notebooks-0.0.130/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/sample-namespace.plugin-a-1.53.0/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/sample-namespace.plugin-b-1.53.0/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/vue.volar-3.0.0-alpha.0/extension/readme.md',
    ];
    return this.doChange(async () => {
      await this.initialized;
      const extension = await this.refresh({ id }) ?? this.getPlugin(id);
      if (!extension) {
        throw new Error(`Failed to resolve ${id} extension.`);
      }
      if (extension.readme === undefined) {
        try {
          const [_, { content: readme }] = await messagingService.get<any>(`http://localhost:8080/api/file${readmes.find(r => r.includes(id))}`);
          extension.update({ readme: this.compileReadme(readme) });
        }
        catch (e) {
          console.error((e as Error).stack);
        }
      }
      return extension;
    });
  }

  protected async refresh(data: any): Promise<IPlugin | undefined> {
    let plugin = this.getPlugin(data.id);
    if (!this.shouldRefresh(plugin)) {
      return plugin;
    }
    plugin = this.setPlugin(data.id);
    plugin.update(data);
    return plugin;
  }

  protected doChange<T>(task: () => Promise<T>): Promise<T>;
  protected doChange<T>(task: () => Promise<T>, token: CancellationToken): Promise<T | undefined>;
  protected doChange<T>(task: () => Promise<T>, token: CancellationToken = CancellationToken.None): Promise<T | undefined> {
    const taskWrapper = async () => {
      if (token && token.isCancellationRequested) {
        return;
      }
      const result = await task();
      if (token && token.isCancellationRequested) {
        return;
      }
      this._onDidChange.fire();
      return result;
    };

    return taskWrapper();
  }

  /**
   * Compare two extensions based on their display name, and publisher if applicable.
   * @param a the first extension id for comparison.
   * @param b the second extension id for comparison.
   */
  protected comparePlugins(a: string, b: string): number {
    const extensionA = this.getPlugin(a);
    const extensionB = this.getPlugin(b);
    if (!extensionA || !extensionB) {
      return 0;
    }
    if (extensionA.displayName && extensionB.displayName) {
      return extensionA.displayName.localeCompare(extensionB.displayName);
    }
    if (extensionA.publisher && extensionB.publisher) {
      return extensionA.publisher.localeCompare(extensionB.publisher);
    }
    return 0;
  }

  protected onDidFailRefresh(id: string, error: unknown): IPlugin | undefined {
    const cached = this.getPlugin(id);
    if (cached && cached.installed) {
      return cached;
    }
    console.error(`[${id}]: failed to refresh, reason:`, error);
    return undefined;
  }

  setOnlyShowVerifiedExtensions(_bool: boolean): void {
    this.updateSearchResult();
  }

  protected updateSearchResult = pDebounce(async () => {
    const { token } = this.resetSearchCancellationTokenSource();
    await this.doUpdateSearchResult({ query: this.pluginSearchModel.query, includeAllVersions: true }, token);
  }, 500);

  protected resetSearchCancellationTokenSource(): CancellationTokenSource {
    this.searchCancellationTokenSource.cancel();
    return this.searchCancellationTokenSource = new CancellationTokenSource();
  }

  protected doUpdateSearchResult(_param: any, _token: CancellationToken): Promise<void> {
    return Promise.resolve();
  }

  protected compileReadme(readmeMarkdown: string): string {
    const readmeHtml = markdownit({ html: true }).render(readmeMarkdown);
    return DOMPurify.sanitize(readmeHtml);
  }

  /**
   * Determines if the given extension should be refreshed.
   * @param extension the extension to refresh.
   */
  protected shouldRefresh(extension?: any): boolean {
    if (extension === undefined) {
      return true;
    }
    return !extension.builtin;
  }
}

export const IPluginRegistry = createServiceDecorator<IPluginRegistry>(PluginRegistry.name);
export type IPluginRegistry = PluginRegistry;
