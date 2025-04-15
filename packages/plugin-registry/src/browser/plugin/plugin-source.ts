import { TreeElement, TreeSource } from "@gepick/core/browser";
import { InjectableService, PostConstruct, createServiceDecorator, lodashDebounce } from "@gepick/core/common";
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

// TODO(@jaylenchen): 目前这个pluginsource有很大问题，按照theia的做法，故意设计成多个子container，然后分别绑定自己的source以及相关服务，最终可以得到不同的plugin source。但是目前我们全局都是唯一的plugin source，拿到的结果都是一样的
export class PluginsSource extends TreeSource {
  protected scheduleFireDidChange = lodashDebounce(() => this.fireDidChange(), 100, { leading: false, trailing: true });

  constructor(
    @IPluginsSourceOptions protected readonly options: IPluginsSourceOptions,
    @IPluginsModel protected readonly model: IPluginsModel,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.fireDidChange();
    this._register(this.model.onDidChange(() => {
      this.scheduleFireDidChange();
    }));
  }

  getModel(): IPluginsModel {
    return this.model;
  }

  *getElements(): IterableIterator<TreeElement> {
    const elements = this.doGetElements();
    for (const id of elements) {
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
