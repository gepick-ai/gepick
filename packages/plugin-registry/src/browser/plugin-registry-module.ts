import { Module, ServiceModule } from "@gepick/core/common";
import { PluginRegistryViewContribution } from "./view/plugin-registry-view-contribution";
import { PluginsViewContainer } from "./plugin/plugin-view-container";
import { PluginListWidget, PluginListWidgetFactory, PluginListOptions } from "./plugin/plugin-list-widget";
import { SearchModel } from "./search/search-model";
import { SearchBar } from "./search/search-bar";
import { PluginsSource } from "./plugin/plugin-source";
import { PluginEditorWidget, PluginEditorWidgetFactory } from "./editor/plugin-editor";
import { Plugin, PluginFactory } from "./plugin/plugin-component";
import { PluginsModel } from "./plugin/plugin-model";
import { CurViewContainerIdentifier, PluginRegistryViewContainerFactory } from "./view/plugin-registry-factory";
import { PluginEditorManager } from "./editor/plugin-editor-manager";

import "./style/index.css";

@Module({
  services: [
    PluginEditorWidget,
    PluginEditorWidgetFactory,
    PluginEditorManager,
    PluginListOptions,
    PluginsSource,
    SearchBar,
    SearchModel,
    PluginsModel,
    Plugin,
    PluginFactory,
    PluginListWidget,
    PluginListWidgetFactory,
    PluginsViewContainer,
    PluginRegistryViewContainerFactory,
    PluginRegistryViewContribution,
    CurViewContainerIdentifier,
  ],
})
export class PluginRegistryModule extends ServiceModule {}
