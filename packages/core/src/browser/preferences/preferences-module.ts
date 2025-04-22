import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesManager } from "./preferences-manager";
import { PreferencesSchemaService } from "./preferences-schema-service";
import { PreferenceProxyHandler, PreferencesProxyFactory } from "./preferences-proxy";
import { PreferencesConfiguration } from "./preferences-configuration";

@Module({
  services: [
    PreferencesManager,
    PreferencesSchemaService,
    PreferencesProxyFactory,
    PreferenceProxyHandler,
    PreferencesConfiguration,
  ],
})
export class PreferencesModule extends ServiceModule {}
