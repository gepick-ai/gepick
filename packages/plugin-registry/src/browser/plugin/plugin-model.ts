import { CancellationToken, CancellationTokenSource, Emitter, Event, InjectableService, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { DOMPurify, markdownit } from "@gepick/core/browser";
import debounce from 'p-debounce';
import { IPluginRegistrySearchModel } from "../search/plugin-registry-search-model";

export class PluginsModel extends InjectableService {
  protected initialized: Promise<void>;
  /**
   * Single source for all extensions
   */
  protected readonly extensions = new Map<string, any>();
  protected readonly onDidChangeEmitter = new Emitter<void>();
  protected _installed = new Set<string>();
  protected _recommended = new Set<string>();
  protected _searchResult = new Set<string>();
  protected _searchError?: string;

  protected searchCancellationTokenSource = new CancellationTokenSource();

  @IPluginRegistrySearchModel readonly search: IPluginRegistrySearchModel;

  get onDidChange(): Event<void> {
    return this.onDidChangeEmitter.event;
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
    // await this.pluginSupport.willStart;
    // this.pluginSupport.onDidChangePlugins(() => this.updateInstalled());
    try {
      await this.updateInstalled();
    }
    catch (e) {
      console.error(e);
    }
  }

  protected async initSearchResult(): Promise<void> {
    this.search.onDidChangeQuery(() => this.updateSearchResult());
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

  getExtension(id: string): any | undefined {
    return this.extensions.get(id);
  }

  setOnlyShowVerifiedExtensions(_bool: boolean): void {
    this.updateSearchResult();
  }

  protected async updateInstalled(): Promise<void> {
    return Promise.resolve();
  }

  protected updateSearchResult = debounce(async () => {
    const { token } = this.resetSearchCancellationTokenSource();
    await this.doUpdateSearchResult({ query: this.search.query, includeAllVersions: true }, token);
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

export const IPluginsModel = createServiceDecorator<IPluginsModel>(PluginsModel.name);
export type IPluginsModel = PluginsModel;
