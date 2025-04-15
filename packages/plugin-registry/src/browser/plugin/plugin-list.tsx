import { IWidgetFactory, Message, SourceTreeWidget, TreeModel, TreeNode } from "@gepick/core/browser";
import { Contribution, Emitter, IServiceContainer, InjectableService, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPluginSource, IPluginsSourceOptions, PluginsSourceOptions } from "./plugin-source";

export class PluginListOptions extends PluginsSourceOptions {
  static override name = PluginsSourceOptions.name;
  static readonly id: string;
  title?: string;
}

export const IPluginListWidget = createServiceDecorator<IPluginListWidget>(SourceTreeWidget.name);
export type IPluginListWidget = PluginListWidget;

/**
 * Plugin列表小组件，比如Installed Plugin List、Recommend Plugin List
 */
export class PluginListWidget extends SourceTreeWidget {
  static override name = SourceTreeWidget.name;
  static ID = 'vsx-extensions';

  protected _badge?: number;
  protected _badgeTooltip?: string;

  protected _onDidChangeBadge = new Emitter<void>();
  public readonly onDidChangeBadge = this._onDidChangeBadge.event;

  protected _onDidChangeBadgeTooltip = new Emitter<void>();
  public readonly onDidChangeBadgeTooltip = this._onDidChangeBadgeTooltip.event;

  @IPluginsSourceOptions protected readonly pluginListOptions: PluginListOptions;
  @IPluginSource protected readonly extensionsSource: IPluginSource;

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

  static createPluginListWidgetId(widgetId: string): string {
    return `${PluginListWidget.ID}:${widgetId}`;
  };

  @PostConstruct()
  protected override init(): void {
    super.init();

    this.addClass('theia-vsx-extensions');

    this.id = PluginListWidget.createPluginListWidgetId(this.pluginListOptions.id);
    this.toDispose.add(this.extensionsSource);
    this.source = this.extensionsSource;

    // TODO(@jaylenchen): 这里记得修改为动态的id
    (this.source as any).options.id = 'installed';

    const title = this.pluginListOptions.title ?? this.computeTitle();
    this.title.label = title;
    this.title.caption = title;

    this.toDispose.add(this.source.onDidChange(async () => {
      this.badge = await this.resolveCount();
    }));
  }

  protected computeTitle(): string {
    switch (this.pluginListOptions.id) {
      case PluginsSourceOptions.INSTALLED:
        return 'Installed';
      case PluginsSourceOptions.BUILT_IN:
        return 'Built-in';
      case PluginsSourceOptions.RECOMMENDED:
        return 'Recommended';
      case PluginsSourceOptions.SEARCH_RESULT:
        return 'Open VSX Registry';
      default:
        return '';
    }
  }

  protected async resolveCount(): Promise<number | undefined> {
    if (this.pluginListOptions.id !== PluginsSourceOptions.SEARCH_RESULT) {
      const elements = await this.source?.getElements() || [];

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
    if (this.pluginListOptions.id === PluginsSourceOptions.SEARCH_RESULT) {
      const searchError = this.extensionsSource.getModel().searchError;
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
    if (this.pluginListOptions.id === PluginsSourceOptions.INSTALLED) {
      // This is needed when an Extension was installed outside of the extension view.
      // E.g. using explorer context menu.
      this.doUpdateRows();
    }
  }
}

@Contribution(IWidgetFactory)
export class PluginListWidgetFactory extends InjectableService {
  public readonly id = PluginListWidget.ID;

  createWidget(container: IServiceContainer, options: IPluginsSourceOptions) {
    container.rebind(PluginListOptions.getServiceId()).toConstantValue(options);
    container.rebind(PluginListWidget.getServiceId()).to(PluginListWidget).inRequestScope();

    const widget = container.get<IPluginListWidget>(IPluginListWidget);

    return widget;
  }
}
