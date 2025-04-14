import { Module, ServiceModule } from "@gepick/core/common";
import { PluginRegistryViewContribution } from "./view/plugin-registry-view-contribution";
import { PluginsViewContainer } from "./plugin/plugin-view-container";
import { PluginsWidget, PluginsWidgetOptions } from "./plugin/plugin-widget";
import { PluginRegistrySearchModel } from "./search/plugin-registry-search-model";
import { PluginRegistrySearchBar } from "./search/plugin-registry-search-bar";
import { PluginsSource } from "./plugin/plugin-source";
import { PluginEditor } from "./editor/plugin-editor";
import { Plugin, PluginFactory } from "./plugin/plugin-component";
import { PluginsModel } from "./plugin/plugin-model";
import { CurViewContainerIdentifier, PluginEditorFactory, PluginRegistryViewContainerFactory, PluginsWidgetFactory } from "./view/plugin-registry-factory";
import { PluginEditorManager } from "./editor/plugin-editor-manager";

import "./style/index.css";

@Module({
  services: [
    PluginEditor,
    PluginEditorFactory,
    PluginEditorManager,
    PluginsWidgetOptions,
    PluginsSource,
    PluginRegistrySearchBar,
    PluginRegistrySearchModel,
    PluginsModel,
    Plugin,
    PluginFactory,
    PluginsWidget,
    PluginsWidgetFactory,
    PluginsViewContainer,
    PluginRegistryViewContainerFactory,
    PluginRegistryViewContribution,
    CurViewContainerIdentifier,
  ],
})
export class PluginRegistryModule extends ServiceModule {}
