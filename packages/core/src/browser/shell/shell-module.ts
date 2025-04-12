import { Module, ServiceModule } from "@gepick/core/common";
import { SplitPositionHandler } from "./side-panel";
import { ApplicationShell } from "./shell";
import { ViewContainer, ViewContainerIdentifier } from "./view-container";
import { TabBarToolbar, TabBarToolbarRegistry } from "./tab-bar-toolbar";

@Module({
  services: [
    ApplicationShell,
    SplitPositionHandler,
    TabBarToolbar,
    TabBarToolbarRegistry,
    ViewContainerIdentifier,
    ViewContainer,
  ],
})
export class ApplicationShellModule extends ServiceModule {}
