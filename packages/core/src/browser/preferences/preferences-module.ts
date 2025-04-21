import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesManager } from "./preferences-manager";
import { PreferencesSchemaService } from "./preferences-schema-service";
import { PreferenceProxyHandler, PreferencesProxyFactory } from "./preferences-proxy";

@Module({
  services: [
    PreferencesManager,
    PreferencesSchemaService,
    PreferencesProxyFactory,
    PreferenceProxyHandler,
  ],
})
export class PreferencesModule extends ServiceModule {}
