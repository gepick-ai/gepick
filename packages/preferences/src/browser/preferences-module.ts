import { Module, ServiceModule } from "@gepick/core/common";
import { PreferencesView } from "./view/preferences-view-contribution";

@Module({
  services: [
    PreferencesView,
  ],
})
export class PreferencesViewModule extends ServiceModule {}
