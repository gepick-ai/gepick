import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesService } from "./preferences-service";
import { PreferenceProxyHandler, PreferencesProxyFactory } from "./preferences-proxy";
import { preferencesSchemaParts } from "./test";

@Module({
  services: [
    PreferencesService,
    PreferencesProxyFactory,
    PreferenceProxyHandler,
    ...preferencesSchemaParts,
  ],
})
export class PreferencesModule extends ServiceModule {}
