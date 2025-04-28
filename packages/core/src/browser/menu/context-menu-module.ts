import { Module, ServiceModule } from "@gepick/core/common";
import { ContextKeyServiceDummyImpl } from "./context-key-service";
import { BrowserContextMenuRenderer } from "./browser-context-menu-renderer";
import { BrowserMainMenuFactory } from "./browser-menu-plugin";
import { ContextMenuContext } from "./context-menu-context";

@Module({
  services: [
    ContextKeyServiceDummyImpl,
    BrowserContextMenuRenderer,
    ContextMenuContext,
    BrowserMainMenuFactory,
  ],
})
export class ContextMenuModule extends ServiceModule {}
