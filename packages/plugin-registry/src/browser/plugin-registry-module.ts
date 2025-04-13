import { Module, ServiceModule } from "@gepick/core/common";
import { PluginRegistryViewContribution } from "./view/plugin-registry-view-contribution";
import { PluginsViewContainer } from "./plugin/plugin-view-container";
import { PluginsWidget } from "./plugin/plugin-widget";
import { PluginRegistrySearchModel } from "./search/plugin-registry-search-model";
import { PluginRegistrySearchBar } from "./search/plugin-registry-search-bar";
import { PluginsSource, PluginsSourceOptions } from "./plugin/plugin-source";
import { PluginEditor } from "./editor/plugin-editor";
import "./style/index.css";
import { PluginsModel } from "./plugin/plugin-model";
import { PluginRegistryViewContainerFactory } from "./view/plugin-registry-factory";

@Module({
  services: [
    PluginEditor,
    PluginsSourceOptions,
    PluginsSource,
    PluginRegistrySearchBar,
    PluginRegistrySearchModel,
    PluginsWidget,
    PluginsModel,
    PluginsViewContainer,
    PluginRegistryViewContainerFactory,
    PluginRegistryViewContribution,
  ],
})
export class PluginRegistryModule extends ServiceModule {}
