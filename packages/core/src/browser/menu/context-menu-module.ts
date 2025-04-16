import { Module, ServiceModule } from "@gepick/core/common";
import { ContextKeyServiceDummyImpl } from "./context-key-service";
import { BrowserContextMenuRenderer, BrowserMainMenuFactory } from "./browser-context-menu-renderer";

@Module({
  services: [
    ContextKeyServiceDummyImpl,
    BrowserContextMenuRenderer,
    BrowserMainMenuFactory,
  ],
})
export class ContextMenuModule extends ServiceModule {}
