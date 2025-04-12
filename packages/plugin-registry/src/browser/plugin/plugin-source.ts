import { TreeElement, TreeSource } from "@gepick/core/browser";
import { InjectableService, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import debounce from "lodash.debounce";
import { IPluginsModel } from "./plugin-model";

export class PluginsSourceOptions extends InjectableService {
  static INSTALLED = 'installed';
  static BUILT_IN = 'builtin';
  static SEARCH_RESULT = 'searchResult';
  static RECOMMENDED = 'recommended';
  readonly id: string;
}
export const IPluginsSourceOptions = createServiceDecorator(PluginsSourceOptions.name);
export type IPluginsSourceOptions = PluginsSourceOptions;

export class PluginsSource extends TreeSource {
  protected scheduleFireDidChange = debounce(() => this.fireDidChange(), 100, { leading: false, trailing: true });

  constructor(
    @IPluginsSourceOptions protected readonly options: IPluginsSourceOptions,
    @IPluginsModel protected readonly model: IPluginsModel,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.fireDidChange();
    this._register(this.model.onDidChange(() => this.scheduleFireDidChange()));
  }

  getModel(): IPluginsModel {
    return this.model;
  }

  *getElements(): IterableIterator<TreeElement> {
    for (const id of this.doGetElements()) {
      const extension = this.model.getExtension(id);
      if (!extension) {
        continue;
      }
      if (this.options.id === PluginsSourceOptions.RECOMMENDED) {
        if (this.model.isInstalled(id)) {
          continue;
        }
      }
      if (this.options.id === PluginsSourceOptions.BUILT_IN) {
        if (extension.builtin) {
          yield extension;
        }
      }
      else if (!extension.builtin) {
        yield extension;
      }
    }
  }

  protected doGetElements(): IterableIterator<string> {
    if (this.options.id === PluginsSourceOptions.SEARCH_RESULT) {
      return this.model.searchResult;
    }

    return this.model.installed;
  }
}

export const IPluginSource = createServiceDecorator<IPluginSource>(PluginsSource.name);
export type IPluginSource = PluginsSource;
