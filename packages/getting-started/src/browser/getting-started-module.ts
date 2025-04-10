import { Module, ServiceModule } from "@gepick/core/common";
import { GettingStartedWidget } from "./getting-started-widget";
import { GettingStartedViewContribution } from "./getting-started-view-contribution";
import { GettingStartedFactory } from "./getting-started-factory";

@Module({
  services: [
    GettingStartedWidget,
    GettingStartedFactory,
    GettingStartedViewContribution,
  ],
})
export class GettingStartedModule extends ServiceModule {}
