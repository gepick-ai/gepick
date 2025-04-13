import { Module, ServiceModule } from "@gepick/core/common";
import { PluginRegistryViewContribution } from "./view/plugin-registry-view-contribution";
import { PluginsViewContainer } from "./plugin/plugin-view-container";
import { PluginsWidget, PluginsWidgetOptions } from "./plugin/plugin-widget";
import { PluginRegistrySearchModel } from "./search/plugin-registry-search-model";
import { PluginRegistrySearchBar } from "./search/plugin-registry-search-bar";
import { PluginsSource } from "./plugin/plugin-source";
import { PluginEditor } from "./editor/plugin-editor";
import "./style/index.css";
import { PluginsModel } from "./plugin/plugin-model";
import { CurViewContainerIdentifier, PluginRegistryViewContainerFactory, PluginsWidgetFactory } from "./view/plugin-registry-factory";

@Module({
  services: [
    PluginEditor,
    PluginsWidgetOptions,
    PluginsSource,
    PluginRegistrySearchBar,
    PluginRegistrySearchModel,
    PluginsModel,
    PluginsWidget,
    PluginsWidgetFactory,
    PluginsViewContainer,
    PluginRegistryViewContainerFactory,
    PluginRegistryViewContribution,
    CurViewContainerIdentifier,
  ],
})
export class PluginRegistryModule extends ServiceModule {}
