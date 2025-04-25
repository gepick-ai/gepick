import { createTreeContainer } from "@gepick/core/browser";
import { Container, ServiceContainer, interfaces } from "@gepick/core/common";
import { PreferenceTreeModel } from "../preferences-tree-model";
import { PreferencesTreeWidget } from "./preferences-tree-widget";
import { PreferencesEditorWidget } from "./preferences-editor-widget";
import { PreferencesSearchbarWidget } from "./preferences-searchbar-widget";
import { PreferencesScopeTabBar } from "./preferences-scope-tabbar-widget";
import { PreferencesWidget } from "./preferences-widget";
import { PreferenceNodeRendererFactory } from "./components/preference-node-renderer";
import { PreferenceMarkdownRenderer } from "./components/preference-markdown-renderer";

export function createPreferencesWidgetContainer(parent: interfaces.Container): Container {
  const child = createTreeContainer(parent, {
    model: PreferenceTreeModel,
    widget: PreferencesTreeWidget,
    props: { search: false },
  });

  child.bind(PreferencesEditorWidget.getServiceId()).to(PreferencesEditorWidget);

  child.bind(PreferencesSearchbarWidget.getServiceId()).to(PreferencesSearchbarWidget);
  child.bind(PreferencesScopeTabBar.getServiceId()).to(PreferencesScopeTabBar);
  child.bind(PreferencesWidget.getServiceId()).to(PreferencesWidget);

  child.bind(PreferenceNodeRendererFactory.getServiceId()).to(PreferenceNodeRendererFactory).inSingletonScope();

  child.bind(PreferenceMarkdownRenderer.getServiceId()).to(PreferenceMarkdownRenderer).inSingletonScope();
  child.bind(ServiceContainer.getServiceId()).toConstantValue(child);

  return child;
}
