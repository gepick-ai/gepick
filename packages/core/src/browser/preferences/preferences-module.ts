import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesService } from "./preferences-service";
import { PreferenceProxyHandler, PreferencesProxyFactory } from "./preferences-proxy";
import { preferencesProviders, preferencesSchemaParts } from "./test";
import { PreferenceSchemaProvider } from "./preference-schema-provider";
import { PreferenceConfigurations } from "./preference-configurations";
import { PreferenceLanguageOverrideService } from "./preference-language-override-service";

@Module({
  services: [
    PreferencesService,
    PreferencesProxyFactory,
    PreferenceProxyHandler,
    PreferenceSchemaProvider,
    PreferenceConfigurations,
    PreferenceLanguageOverrideService,
    ...preferencesSchemaParts,
    ...preferencesProviders,
  ],
})
export class PreferencesModule extends ServiceModule {}
