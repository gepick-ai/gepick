import { Message, SourceTreeWidget, TreeModel, TreeNode } from "@gepick/core/browser";
import { Emitter, Event, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPluginSource, IPluginsSourceOptions, PluginsSourceOptions } from "./plugin-source";

export const generateExtensionWidgetId = (widgetId: string): string => `${PluginsWidget.ID}:${widgetId}`;

export class PluginsWidgetOptions extends PluginsSourceOptions {
  static override name = PluginsSourceOptions.name;
  static readonly id: string;
  title?: string;
}

export const IPluginsWidget = createServiceDecorator<IPluginsWidget>(SourceTreeWidget.name);
export type IPluginsWidget = PluginsWidget;

export class PluginsWidget extends SourceTreeWidget {
  static override name = SourceTreeWidget.name;
  static ID = 'vsx-extensions';

  protected _badge?: number;
  protected onDidChangeBadgeEmitter = new Emitter<void>();

  protected _badgeTooltip?: string;
  protected onDidChangeBadgeTooltipEmitter = new Emitter<void>();

  @IPluginsSourceOptions protected readonly options: PluginsWidgetOptions;
  @IPluginSource protected readonly extensionsSource: IPluginSource;

  @PostConstruct()
  protected override init(): void {
    super.init();
    this.addClass('theia-vsx-extensions');

    this.id = generateExtensionWidgetId(this.options.id);
    this.toDispose.add(this.extensionsSource);
    this.source = this.extensionsSource;

    // TODO(@jaylenchen): 这里记得修改为动态的id
    (this.source as any).options.id = 'installed';

    const title = this.options.title ?? this.computeTitle();
    this.title.label = title;
    this.title.caption = title;

    this.toDispose.add(this.source.onDidChange(async () => {
      this.badge = await this.resolveCount();
    }));
  }

  get onDidChangeBadge(): Event<void> {
    return this.onDidChangeBadgeEmitter.event;
  }

  get badge(): number | undefined {
    return this._badge;
  }

  set badge(count: number | undefined) {
    this._badge = count;
    this.onDidChangeBadgeEmitter.fire();
  }

  get onDidChangeBadgeTooltip(): Event<void> {
    return this.onDidChangeBadgeTooltipEmitter.event;
  }

  get badgeTooltip(): string | undefined {
    return this._badgeTooltip;
  }

  set badgeTooltip(tooltip: string | undefined) {
    this._badgeTooltip = tooltip;
    this.onDidChangeBadgeTooltipEmitter.fire();
  }

  protected computeTitle(): string {
    switch (this.options.id) {
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
    if (this.options.id !== PluginsSourceOptions.SEARCH_RESULT) {
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
    if (this.options.id === PluginsSourceOptions.SEARCH_RESULT) {
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
    if (this.options.id === PluginsSourceOptions.INSTALLED) {
      // This is needed when an Extension was installed outside of the extension view.
      // E.g. using explorer context menu.
      this.doUpdateRows();
    }
  }
}
