import { Module, ServiceModule } from "@gepick/core/common";
import { LabelParser, LabelProvider } from "../label";
import { SplitPositionHandler } from "./side-panel";
import { ApplicationShell } from "./shell";
import { ViewContainer } from "./view-container";
import { TabBarToolbar, TabBarToolbarFactory, TabBarToolbarRegistry } from "./tab-bar-toolbar";

@Module({
  services: [
    ApplicationShell,
    SplitPositionHandler,
    TabBarToolbar,
    TabBarToolbarFactory,
    TabBarToolbarRegistry,
    LabelParser,
    LabelProvider,
    ViewContainer,
  ],
})
export class ShellModule extends ServiceModule {}
