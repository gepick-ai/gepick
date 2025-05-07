import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesManager } from "./preferences-manager";
import { PreferencesSchemaService } from "./preferences-schema-service";
import { PreferenceProxyHandler, PreferencesProxyFactory } from "./preferences-proxy";
import { PreferencesConfiguration } from "./preferences-configuration";
import { CorePreferencesProxy, CorePreferencesSchemaPart, PluginPreferencesSchemaPart, ThemePreferencesSchemaPart } from "./test";

@Module({
  services: [
    PreferencesManager,
    PreferencesSchemaService,
    PreferencesProxyFactory,
    PreferenceProxyHandler,
    PreferencesConfiguration,
    CorePreferencesSchemaPart,
    CorePreferencesProxy,
    PluginPreferencesSchemaPart,
    ThemePreferencesSchemaPart,
  ],
})
export class PreferencesModule extends ServiceModule {}
