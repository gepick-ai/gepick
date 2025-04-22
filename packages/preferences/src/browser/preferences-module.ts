import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesView } from "./view/preferences-view-contribution";
import { PreferencesWidget, PreferencesWidgetFactory } from "./views/preferences-widget";
import { PreferencesEditorWidget } from "./views/preferences-editor-widget";
import { PreferencesTreeWidget } from "./views/preferences-tree-widget";
import { PreferencesSearchbarWidget } from "./views/preferences-searchbar-widget";
import { PreferencesScopeTabBar } from "./views/preferences-scope-tabbar-widget";
import { PreferenceTreeModel } from "./preferences-tree-model";
import { PreferenceTreeGenerator } from "./util/preference-tree-generator";
import { PreferenceTreeLabelProvider } from "./util/preference-tree-label-provider";
import { PreferenceLayoutProvider } from "./util/preference-layout";
import { PreferenceOpenHandler } from "./preference-open-handler";

@Module({
  services: [
    PreferencesView,
    PreferencesWidgetFactory,
    PreferencesWidget,
    PreferencesEditorWidget,
    PreferencesTreeWidget,
    PreferencesSearchbarWidget,
    PreferencesScopeTabBar,
    PreferenceTreeModel,
    PreferenceTreeGenerator,
    PreferenceTreeLabelProvider,
    PreferenceLayoutProvider,
    PreferenceOpenHandler,
  ],
})
export class PreferencesViewModule extends ServiceModule {}
