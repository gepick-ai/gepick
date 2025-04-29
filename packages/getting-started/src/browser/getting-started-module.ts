import { Module, ServiceModule } from "@gepick/core/common";
import { GettingStartedWidget } from "./getting-started-widget";
import { GettingStartedView } from "./view/getting-started-view-contribution";
import { GettingStartedFactory } from "./getting-started-factory";

@Module({
  services: [
    GettingStartedWidget,
    GettingStartedFactory,
    GettingStartedView,
  ],
})
export class GettingStartedModule extends ServiceModule {}
