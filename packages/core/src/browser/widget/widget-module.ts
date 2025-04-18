import { Module, ServiceModule } from "@gepick/core/common";
import { WidgetManager } from "./widget-manager";

@Module({
  services: [
    WidgetManager,
  ],
})
export class WidgetModule extends ServiceModule {}
