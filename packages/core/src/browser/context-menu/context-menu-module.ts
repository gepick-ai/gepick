import { Module, ServiceModule } from "@gepick/core/common";
import { ContextKeyServiceDummyImpl } from "./context-key-service";

@Module({
  services: [
    ContextKeyServiceDummyImpl,
  ],
})
export class ContextMenuModule extends ServiceModule {}
