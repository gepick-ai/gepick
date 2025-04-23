import { IWidgetFactory, Message, Mixin, Panel, StatefulWidget, TreeModelImpl, TreeModule, Widget, codicon } from "@gepick/core/browser";
import { Contribution, IServiceContainer, InjectableService, PostConstruct, ServiceContainer, createServiceDecorator } from "@gepick/core/common";
import { PreferenceTreeModel } from "../preferences-tree-model";
import { IPreferencesEditorWidget, PreferencesEditorWidget } from "./preferences-editor-widget";
import { IPreferencesTreeWidget, PreferencesTreeWidget } from "./preferences-tree-widget";
import { IPreferencesSearchbarWidget, PreferencesSearchbarWidget } from "./preferences-searchbar-widget";
import { IPreferencesScopeTabBar, PreferencesScopeTabBar } from "./preferences-scope-tabbar-widget";
import { PreferenceNodeRendererFactory } from "./components/preference-node-renderer";
import { DefaultPreferenceNodeRendererCreatorRegistry } from "./components/preference-node-renderer-creator";

export class BasePanel extends Mixin(Panel, InjectableService) {}
export class PreferencesWidget extends BasePanel implements StatefulWidget {
  /**
   * The widget `id`.
   */
  static readonly ID = 'settings_widget';
  /**
   * The widget `label` which is used for display purposes.
   */
  static readonly LABEL = 'Settings';

  constructor(
    @IPreferencesEditorWidget protected readonly editorWidget: IPreferencesEditorWidget,
    @IPreferencesTreeWidget protected readonly treeWidget: IPreferencesTreeWidget,
    @IPreferencesSearchbarWidget protected readonly searchbarWidget: IPreferencesSearchbarWidget,
    @IPreferencesScopeTabBar protected readonly tabBarWidget: IPreferencesScopeTabBar,
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
    this.addClass('theia-settings-container');
    this.title.iconClass = codicon('settings');

    this.searchbarWidget.addClass('preferences-searchbar-widget');
    this.addWidget(this.searchbarWidget);

    this.tabBarWidget.addClass('preferences-tabbar-widget');
    this.addWidget(this.tabBarWidget);

    this.treeWidget.addClass('preferences-tree-widget');
    this.addWidget(this.treeWidget);

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

@Contribution(IWidgetFactory)
export class PreferencesWidgetFactory extends InjectableService {
  public readonly id = PreferencesWidget.ID;

  createWidget(container: IServiceContainer) {
    const child = container.createChild({ defaultScope: "Singleton" });
    child.load(new TreeModule(child as any));

    child.bind(PreferenceTreeModel.getServiceId()).to(PreferenceTreeModel);
    child.bind(PreferencesTreeWidget.getServiceId()).to(PreferencesTreeWidget);
    child.bind(PreferencesWidget.getServiceId()).to(PreferencesWidget);
    child.bind(PreferencesEditorWidget.getServiceId()).to(PreferencesEditorWidget);
    child.bind(PreferencesSearchbarWidget.getServiceId()).to(PreferencesSearchbarWidget);
    child.bind(PreferencesScopeTabBar.getServiceId()).to(PreferencesScopeTabBar);
    child.bind(PreferenceNodeRendererFactory.getServiceId()).to(PreferenceNodeRendererFactory);
    child.bind(ServiceContainer.getServiceId()).toConstantValue(child);

    return child.get<IPreferencesWidget>(PreferencesWidget.getServiceId());
  }
}
