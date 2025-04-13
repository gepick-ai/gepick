import { Message, PanelLayout, ViewContainer, ViewContainerPart, codicon } from "@gepick/core/browser";
import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPluginRegistrySearchBar } from "../search/plugin-registry-search-bar";
import { PluginSearchMode } from "../search/plugin-registry-search-model";
import { IPluginsModel } from "./plugin-model";
import { generateExtensionWidgetId } from "./plugin-widget";
import { PluginsSourceOptions } from "./plugin-source";

export class PluginsViewContainer extends ViewContainer {
  static ID = 'vsx-extensions-view-container';
  static LABEL = 'Extensions';

  override disableDNDBetweenContainers = true;

  @IPluginRegistrySearchBar protected readonly searchBar: IPluginRegistrySearchBar;

  @IPluginsModel protected readonly model: IPluginsModel;

  @PostConstruct()
  protected override init(): void {
    super.init();
    this.id = PluginsViewContainer.ID;
    this.addClass('theia-vsx-extensions-view-container');

    this.setTitleOptions({
      label: PluginsViewContainer.LABEL,
      iconClass: codicon('extensions'),
      closeable: true,
    });
  }

  protected override onActivateRequest(_msg: Message): void {
    this.searchBar.activate();
  }

  protected override onAfterAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.updateMode();
    this.toDisposeOnDetach.add(this.model.search.onDidChangeQuery(() => this.updateMode()));
  }

  protected override configureLayout(layout: PanelLayout): void {
    // layout.addWidget(this.searchBar);
    super.configureLayout(layout);
  }

  protected currentMode: PluginSearchMode = PluginSearchMode.Initial;
  protected readonly lastModeState = new Map<PluginSearchMode, ViewContainer.State>();

  protected updateMode(): void {
    const currentMode = this.model.search.getModeForQuery();
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
    return part.wrapped.id !== generateExtensionWidgetId(PluginsSourceOptions.SEARCH_RESULT);
  }

  protected getWidgetsForMode(): string[] {
    switch (this.currentMode) {
      case PluginSearchMode.Builtin:
        return [generateExtensionWidgetId(PluginsSourceOptions.BUILT_IN)];
      case PluginSearchMode.Installed:
        return [generateExtensionWidgetId(PluginsSourceOptions.INSTALLED)];
      case PluginSearchMode.Recommended:
        return [generateExtensionWidgetId(PluginsSourceOptions.RECOMMENDED)];
      case PluginSearchMode.Search:
        return [generateExtensionWidgetId(PluginsSourceOptions.SEARCH_RESULT)];
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
      query: this.model.search.query,
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
    this.model.search.query = state.query;
  }

  protected override updateToolbarItems(allParts: ViewContainerPart[]): void {
    super.updateToolbarItems(allParts);
  }

  protected override getToggleVisibilityGroupLabel(): string {
    return `a/'Views'`;
  }
}
export const IPluginsViewContainer = createServiceDecorator<IPluginsViewContainer>(PluginsViewContainer.name);
export type IPluginsViewContainer = PluginsViewContainer;

export namespace PluginsViewContainer {
  export interface State {
    query: string;
    modes: {
      [mode: number]: ViewContainer.State | undefined;
    };
  }
}
