import { AbstractWidgetFactory, Message, SourceTreeWidget, TreeElement, TreeModel, TreeNode, TreeSource } from "@gepick/core/browser";
import { Emitter, IServiceContainer, InjectableService, PostConstruct, ServiceContainer, createServiceDecorator, lodashDebounce } from "@gepick/core/common";
import { IPluginRegistry } from "./plugin-registry";

// #region Plugin List Model Options
export class PluginListModelOptions extends InjectableService {
  static INSTALLED = 'installed';
  static BUILT_IN = 'builtin';
  static SEARCH_RESULT = 'searchResult';
  static RECOMMENDED = 'recommended';
  readonly id: string;
}
export const IPluginListModelOptions = createServiceDecorator(PluginListModelOptions.name);
export type IPluginListModelOptions = PluginListModelOptions;
// #endregion

// #region Plugin List Model
// TODO(@jaylenchen): 目前这个pluginsource有很大问题，按照theia的做法，故意设计成多个子container，然后分别绑定自己的source以及相关服务，最终可以得到不同的plugin source。但是目前我们全局都是唯一的plugin source，拿到的结果都是一样的
export class PluginListModel extends TreeSource {
  constructor(
    @IPluginListModelOptions protected readonly pluginListModelOptions: IPluginListModelOptions,
    @IPluginRegistry protected readonly pluginRegistry: IPluginRegistry,
  ) {
    super({ id: `plugin-list-model:${pluginListModelOptions.id}` });
  }

  @PostConstruct()
  protected init(): void {
    this._onDidChange.fire();
    const scheduleFireDidChange = lodashDebounce(() => this._onDidChange.fire(), 100, { leading: false, trailing: true });
    this._register(this.pluginRegistry.onDidChange(() => scheduleFireDidChange()));
  }

  getPluginRegistry(): IPluginRegistry {
    return this.pluginRegistry;
  }

  *getElements(): IterableIterator<TreeElement> {
    const elements = this.doGetElements();

    for (const id of elements) {
      const plugin = this.pluginRegistry.getPlugin(id);
      if (!plugin) {
        continue;
      }
      if (this.pluginListModelOptions.id === PluginListModelOptions.RECOMMENDED) {
        if (this.pluginRegistry.isInstalled(id)) {
          continue;
        }
      }
      if (this.pluginListModelOptions.id === PluginListModelOptions.BUILT_IN) {
        if (plugin.builtin) {
          yield plugin;
        }
      }
      else if (!plugin.builtin) {
        yield plugin;
      }
    }
  }

  protected doGetElements(): IterableIterator<string> {
    if (this.pluginListModelOptions.id === PluginListModelOptions.SEARCH_RESULT) {
      return this.pluginRegistry.searchResult;
    }

    return this.pluginRegistry.installed;
  }
}

export const IPluginListModel = createServiceDecorator<IPluginListModel>(PluginListModel.name);
export type IPluginListModel = PluginListModel;
// #endregion

// #region Plugin List Widget Options
export class PluginListWidgetOptions extends PluginListModelOptions {
  static override name = PluginListModelOptions.name;
  static readonly id: string;
  title?: string;
}
// #endregion

// #region Plugin List Widget
/**
 * Plugin列表小组件，比如Installed Plugin List Widget、Recommend Plugin List Widget、Recommend
 */
export class PluginListWidget extends SourceTreeWidget {
  static override name = SourceTreeWidget.name;
  static ID = 'vsx-extensions';

  static createPluginListWidgetId(widgetId: string): string {
    return `${PluginListWidget.ID}:${widgetId}`;
  };

  protected _badge?: number;
  protected _badgeTooltip?: string;

  protected _onDidChangeBadge = new Emitter<void>();
  public readonly onDidChangeBadge = this._onDidChangeBadge.event;

  protected _onDidChangeBadgeTooltip = new Emitter<void>();
  public readonly onDidChangeBadgeTooltip = this._onDidChangeBadgeTooltip.event;

  @IPluginListModelOptions protected readonly pluginListWidgetOptions: PluginListWidgetOptions;
  @IPluginListModel protected readonly pluginListModel: IPluginListModel;

  get badge(): number | undefined {
    return this._badge;
  }

  set badge(count: number | undefined) {
    this._badge = count;
    this._onDidChangeBadge.fire();
  }

  get badgeTooltip(): string | undefined {
    return this._badgeTooltip;
  }

  set badgeTooltip(tooltip: string | undefined) {
    this._badgeTooltip = tooltip;
    this._onDidChangeBadgeTooltip.fire();
  }

  @PostConstruct()
  protected override init(): void {
    super.init();

    this.addClass('theia-vsx-extensions');
    this.toDispose.push(this.pluginListModel);

    this.id = PluginListWidget.createPluginListWidgetId(this.pluginListWidgetOptions.id);
    this.source = this.pluginListModel;

    const title = this.pluginListWidgetOptions.title ?? this.computeTitle();
    this.title.label = title;
    this.title.caption = title;

    this.toDispose.push(this.source.onDidChange(async () => {
      this.badge = await this.resolveCount();
    }));
  }

  protected computeTitle(): string {
    switch (this.pluginListWidgetOptions.id) {
      case PluginListModelOptions.INSTALLED:
        return 'Installed';
      case PluginListModelOptions.BUILT_IN:
        return 'Built-in';
      case PluginListModelOptions.RECOMMENDED:
        return 'Recommended';
      case PluginListModelOptions.SEARCH_RESULT:
        return 'Open VSX Registry';
      default:
        return '';
    }
  }

  protected async resolveCount(): Promise<number | undefined> {
    if (this.pluginListWidgetOptions.id !== PluginListModelOptions.SEARCH_RESULT) {
      const elements = await this.pluginListModel?.getElements() || [];

      return [...elements].length;
    }
    return undefined;
  }

  protected override tapNode(node?: TreeNode): void {
    super.tapNode(node);
    this.model.openNode(node);
  }

  protected override handleDblClickEvent(): void {
    // Don't open the editor view on a double click.
  }

  protected override renderTree(model: TreeModel): React.ReactNode {
    if (this.pluginListWidgetOptions.id === PluginListModelOptions.SEARCH_RESULT) {
      const searchError = this.pluginListModel.getPluginRegistry().searchError;
      if (searchError) {
        const message = 'Error fetching extensions.';
        const configurationHint = 'This could be caused by network configuration issues.';
        const hint = searchError.includes('ENOTFOUND') ? configurationHint : '';
        // eslint-disable-next-line no-console
        console.log(`${message} ${searchError} ${hint}`);
      }
    }
    return super.renderTree(model);
  }

  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    if (this.pluginListWidgetOptions.id === PluginListModelOptions.INSTALLED) {
      // This is needed when an Extension was installed outside of the extension view.
      // E.g. using explorer context menu.
      this.doUpdateRows();
    }
  }
}
export const IPluginListWidget = createServiceDecorator<IPluginListWidget>(PluginListWidget.name);
export type IPluginListWidget = PluginListWidget;
// #endregion

// #region Plugin List Widget Factory
export class PluginListWidgetFactory extends AbstractWidgetFactory {
  public override readonly id = PluginListWidget.ID;

  createWidget(container: IServiceContainer, options: IPluginListModelOptions) {
    const child = SourceTreeWidget.createContainer(container, {
      virtualized: false,
      scrollIfActive: true,
    });
    child.bind(PluginListWidgetOptions.getServiceId()).toConstantValue(options);
    child.unbind(SourceTreeWidget.getServiceId());
    child.bind(PluginListModel.getServiceId()).to(PluginListModel);
    child.bind(PluginListWidget.getServiceId()).to(PluginListWidget);
    child.bind(ServiceContainer.getServiceId()).toConstantValue(child);

    const widget = child.get<IPluginListWidget>(PluginListWidget.getServiceId());

    return widget;
  }
}
// #endregion
