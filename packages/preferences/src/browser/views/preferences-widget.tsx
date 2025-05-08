import { AbstractPanel, AbstractWidgetFactory, Message, StatefulWidget, Widget, WidgetUtilities } from "@gepick/core/browser";
import { IServiceContainer, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPreferencesEditorWidget } from "./preferences-editor-widget";
import { IPreferencesTreeWidget } from "./preferences-tree-widget";
import { IPreferencesSearchbarWidget } from "./preferences-searchbar-widget";
import { IPreferencesScopeTabBar } from "./preferences-scope-tabbar-widget";
import { createPreferencesWidgetContainer } from "./preference-widget-bindings";

export class PreferencesWidget extends AbstractPanel implements StatefulWidget {
  /**
   * The widget `id`.
   */
  static readonly ID = 'settings-widget';
  /**
   * The widget `label` which is used for display purposes.
   */
  static readonly LABEL = 'Settings';

  constructor(
    @IPreferencesSearchbarWidget protected readonly searchbarWidget: IPreferencesSearchbarWidget,
    @IPreferencesScopeTabBar protected readonly tabBarWidget: IPreferencesScopeTabBar,
    @IPreferencesTreeWidget protected readonly treeWidget: IPreferencesTreeWidget,
    @IPreferencesEditorWidget protected readonly editorWidget: IPreferencesEditorWidget,
  ) {
    super();
  }

  get currentScope() {
    return this.tabBarWidget.currentScope;
  }

  @PostConstruct()
  protected init(): void {
    this.id = PreferencesWidget.ID;
    this.title.label = PreferencesWidget.LABEL;
    this.title.caption = PreferencesWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = WidgetUtilities.codicon('settings-gear');

    this.addClass('theia-settings-container');

    // top searchbar widget
    this.searchbarWidget.addClass('preferences-searchbar-widget');
    this.addWidget(this.searchbarWidget);

    // top tabbar widget
    this.tabBarWidget.addClass('preferences-tabbar-widget');
    this.addWidget(this.tabBarWidget);

    // main-left tree widget
    this.treeWidget.addClass('preferences-tree-widget');
    this.addWidget(this.treeWidget);

    // main-right editor widget
    this.editorWidget.addClass('preferences-editor-widget');
    this.addWidget(this.editorWidget);

    this.update();
  }

  setSearchTerm(query: string): Promise<void> {
    return this.searchbarWidget.updateSearchTerm(query);
  }

  setScope(scope: any): void {
    this.tabBarWidget.setScope(scope);
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    if (msg.width < 600 && this.treeWidget && !this.treeWidget.isHidden) {
      this.treeWidget.hide();
      this.editorWidget.addClass('full-pane');
    }
    else if (msg.width >= 600 && this.treeWidget && this.treeWidget.isHidden) {
      this.treeWidget.show();
      this.editorWidget.removeClass('full-pane');
    }
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.searchbarWidget.focus();
  }

  getPreviewNode(): Node | undefined {
    return this.node;
  }

  storeState() {
    return {
      scopeTabBarState: this.tabBarWidget.storeState(),
      editorState: this.editorWidget.storeState(),
      searchbarWidgetState: this.searchbarWidget.storeState(),
    };
  }

  restoreState(oldState: any): void {
    this.tabBarWidget.restoreState(oldState.scopeTabBarState);
    this.editorWidget.restoreState(oldState.editorState);
    this.searchbarWidget.restoreState(oldState.searchbarWidgetState);
  }
}

export const IPreferencesWidget = createServiceDecorator<IPreferencesWidget>(PreferencesWidget.name);
export type IPreferencesWidget = PreferencesWidget;

export class PreferencesWidgetFactory extends AbstractWidgetFactory {
  public override readonly id = PreferencesWidget.ID;

  createWidget(container: IServiceContainer) {
    container.bind(PreferencesWidget.getServiceId())
      .toDynamicValue(({ container }) => createPreferencesWidgetContainer(container).get(PreferencesWidget.getServiceId()));

    return container.get<IPreferencesWidget>(IPreferencesWidget);
  }
}
