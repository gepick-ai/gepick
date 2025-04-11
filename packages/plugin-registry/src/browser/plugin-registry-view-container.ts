import { Message, PanelLayout, ViewContainer, ViewContainerPart } from "@gepick/core/browser";
import { PostConstruct } from "@gepick/core/common";
import { PluginRegistryWidget } from "./plugin-registry-widget";

export class PluginRegistryViewContainer extends ViewContainer {
  static ID = 'vsx-extensions-view-container';
  static LABEL = 'Extensions';

  @PostConstruct()
  protected override init(): void {
    super.init();
    this.id = PluginRegistryViewContainer.ID;
    this.addClass('theia-vsx-extensions-view-container');

    this.setTitleOptions({
      label: PluginRegistryViewContainer.LABEL,
      iconClass: 'theia-vsx-extensions-icon',
      closeable: true,
    });
  }

  protected override onActivateRequest(_msg: Message): void {
    // this.searchBar.activate();
  }

  protected override onAfterAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.updateMode();
    // this.toDisposeOnDetach.add(this.model.search.onDidChangeQuery(() => this.updateMode()));
  }

  protected override configureLayout(layout: PanelLayout): void {
    // layout.addWidget(this.searchBar);
    super.configureLayout(layout);
  }

  protected currentMode: PluginRegistryViewContainer.Mode = PluginRegistryViewContainer.InitialMode;
  protected readonly lastModeState = new Map<PluginRegistryViewContainer.Mode, ViewContainer.State>();

  protected updateMode(): void {
    const currentMode: PluginRegistryViewContainer.Mode = !this.model.search.query ? PluginRegistryViewContainer.DefaultMode : PluginRegistryViewContainer.SearchResultMode;
    if (currentMode === this.currentMode) {
      return;
    }
    if (this.currentMode !== PluginRegistryViewContainer.InitialMode) {
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
    if (this.currentMode === PluginRegistryViewContainer.SearchResultMode) {
      const searchPart = this.getParts().find(part => part.wrapped.id === PluginRegistryWidget.SEARCH_RESULT_ID);
      if (searchPart) {
        searchPart.collapsed = false;
        searchPart.show();
      }
    }
  }

  protected override registerPart(part: ViewContainerPart): void {
    super.registerPart(part);
    this.applyModeToPart(part);
  }

  protected applyModeToPart(part: ViewContainerPart): void {
    const partMode = (part.wrapped.id === PluginRegistryWidget.SEARCH_RESULT_ID ? PluginRegistryViewContainer.SearchResultMode : PluginRegistryViewContainer.DefaultMode);
    if (this.currentMode === partMode) {
      part.show();
    }
    else {
      part.hide();
    }
  }

  protected override doStoreState(): any {
    const modes: PluginRegistryViewContainer.State['modes'] = {};
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
      const mode = Number(key) as PluginRegistryViewContainer.Mode;
      const modeState = state.modes[mode];
      if (modeState) {
        this.lastModeState.set(mode, modeState);
      }
    }
    this.model.search.query = state.query;
  }
}

export namespace PluginRegistryViewContainer {
  export const InitialMode = 0;
  export const DefaultMode = 1;
  export const SearchResultMode = 2;
  export type Mode = typeof InitialMode | typeof DefaultMode | typeof SearchResultMode;
  export interface State {
    query: string;
    modes: {
      [mode: number]: ViewContainer.State | undefined;
    };
  }
}
