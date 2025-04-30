import { AbstractWidgetFactory, IWidgetManager, Message, PanelLayout, ViewContainer, ViewContainerIdentifier, ViewContainerPart, WidgetManager, WidgetUtilities } from "@gepick/core/browser";
import { IServiceContainer, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPluginSearchBarWidget, IPluginSearchModel, PluginSearchBarWidget, PluginSearchMode } from "../search";
import { PluginListModelOptions, PluginListWidget } from "../plugin";

export class PluginRegistryViewContainer extends ViewContainer {
  static ID = 'vsx-extensions-view-container';
  static LABEL = 'Extensions';

  override disableDNDBetweenContainers = true;

  @IPluginSearchBarWidget protected readonly pluginSearchBarWidget: IPluginSearchBarWidget;
  @IPluginSearchModel protected readonly pluginSearchModel: IPluginSearchModel;

  @PostConstruct()
  protected override init(): void {
    super.init();
    this.id = PluginRegistryViewContainer.ID;
    this.addClass('theia-vsx-extensions-view-container');

    this.setTitleOptions({
      label: PluginRegistryViewContainer.LABEL,
      iconClass: WidgetUtilities.codicon('extensions'),
      closeable: true,
    });
  }

  protected override onActivateRequest(_msg: Message): void {
    this.pluginSearchBarWidget.activate();
  }

  protected override onAfterAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.updateMode();
    this.toDisposeOnDetach.push(this.pluginSearchModel.onDidChangeQuery(() => this.updateMode()));
  }

  protected override configureLayout(layout: PanelLayout): void {
    layout.addWidget(this.pluginSearchBarWidget);
    super.configureLayout(layout);
  }

  protected currentMode: PluginSearchMode = PluginSearchMode.Initial;
  protected readonly lastModeState = new Map<PluginSearchMode, ViewContainer.State>();

  protected updateMode(): void {
    const currentMode = this.pluginSearchModel.getModeForQuery();
    if (currentMode === this.currentMode) {
      return;
    }
    if (this.currentMode !== PluginSearchMode.Initial) {
      this.lastModeState.set(this.currentMode, super.doStoreState());
    }
    this.currentMode = currentMode;
    const lastState = this.lastModeState.get(currentMode);
    if (lastState) {
      super.doRestoreState(lastState);
    }
    else {
      for (const part of this.getParts()) {
        this.applyModeToPart(part);
      }
    }

    const specialWidgets = this.getWidgetsForMode();
    if (specialWidgets?.length) {
      const widgetChecker = new Set(specialWidgets);
      const relevantParts = this.getParts().filter(part => widgetChecker.has(part.wrapped.id));
      relevantParts.forEach((part) => {
        part.collapsed = false;
        part.show();
      });
    }
  }

  protected override registerPart(part: ViewContainerPart): void {
    super.registerPart(part);
    this.applyModeToPart(part);
  }

  protected applyModeToPart(part: ViewContainerPart): void {
    if (this.shouldShowWidget(part)) {
      part.show();
    }
    else {
      part.hide();
    }
  }

  protected shouldShowWidget(part: ViewContainerPart): boolean {
    const widgetsToShow = this.getWidgetsForMode();
    if (widgetsToShow.length) {
      return widgetsToShow.includes(part.wrapped.id);
    }
    return part.wrapped.id !== PluginListWidget.createPluginListWidgetId(PluginListModelOptions.SEARCH_RESULT);
  }

  protected getWidgetsForMode(): string[] {
    switch (this.currentMode) {
      case PluginSearchMode.Builtin:
        return [PluginListWidget.createPluginListWidgetId(PluginListModelOptions.BUILT_IN)];
      case PluginSearchMode.Installed:
        return [PluginListWidget.createPluginListWidgetId(PluginListModelOptions.INSTALLED)];
      case PluginSearchMode.Recommended:
        return [PluginListWidget.createPluginListWidgetId(PluginListModelOptions.RECOMMENDED)];
      case PluginSearchMode.Search:
        return [PluginListWidget.createPluginListWidgetId(PluginListModelOptions.SEARCH_RESULT)];
      default:
        return [];
    }
  }

  protected override doStoreState(): any {
    const modes: PluginsViewContainer.State['modes'] = {};
    for (const mode of this.lastModeState.keys()) {
      modes[mode] = this.lastModeState.get(mode);
    }
    return {
      query: this.pluginSearchModel.query,
      modes,
    };
  }

  protected override doRestoreState(state: any): void {
    for (const key in state.modes) {
      const mode = Number(key) as PluginSearchMode;
      const modeState = state.modes[mode];
      if (modeState) {
        this.lastModeState.set(mode, modeState);
      }
    }
    this.pluginSearchModel.query = state.query;
  }

  protected override updateToolbarItems(allParts: ViewContainerPart[]): void {
    super.updateToolbarItems(allParts);
  }

  protected override getToggleVisibilityGroupLabel(): string {
    return `a/'Views'`;
  }
}
export const IPluginsViewContainer = createServiceDecorator<IPluginsViewContainer>(PluginRegistryViewContainer.name);
export type IPluginsViewContainer = PluginRegistryViewContainer;

export namespace PluginsViewContainer {
  export interface State {
    query: string;
    modes: {
      [mode: number]: ViewContainer.State | undefined;
    };
  }
}

export class CurViewContainerIdentifier extends ViewContainerIdentifier {
  static override name = ViewContainerIdentifier.name;

  override id: string = PluginRegistryViewContainer.ID;
  override progressLocationId?: string = 'extensions';
}

export class PluginRegistryViewContainerFactory extends AbstractWidgetFactory {
  public override readonly id = PluginRegistryViewContainer.ID;

  constructor(
    @IWidgetManager protected readonly widgetManager: IWidgetManager,
  ) {
    super();
  }

  async createWidget(container: IServiceContainer) {
    const child = container.createChild();

    child.bind(PluginRegistryViewContainer.getServiceId()).to(PluginRegistryViewContainer);
    child.bind(PluginSearchBarWidget.getServiceId()).to(PluginSearchBarWidget).inSingletonScope();
    const viewContainer = child.get<IPluginsViewContainer>(PluginRegistryViewContainer.getServiceId());
    const widgetManager = child.get<IWidgetManager>(WidgetManager.getServiceId());
    for (const id of [
      PluginListModelOptions.SEARCH_RESULT,
      PluginListModelOptions.INSTALLED,
      PluginListModelOptions.RECOMMENDED,
      PluginListModelOptions.BUILT_IN,
    ]) {
      const widget = await widgetManager.getOrCreateWidget(PluginListWidget.ID, { id });
      viewContainer.addWidget(widget, {
        initiallyCollapsed: id === PluginListModelOptions.BUILT_IN,
      });
    }
    return viewContainer;
  }
}
