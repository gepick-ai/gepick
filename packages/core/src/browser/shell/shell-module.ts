import { Module, ServiceModule } from "@gepick/core/common";
import { LabelParser, LabelProvider } from "../label";
import { HoverService } from "../services";
import { MarkdownRendererFactory, MarkdownRendererImpl } from "../markdown";
import { DefaultOpenerService } from "../opener";
import { SplitPositionHandler } from "./side-panel";
import { Shell } from "./shell";
import { ViewContainer } from "./view-contribution/view-container";
import { TabBarToolbar, TabBarToolbarFactory, TabBarToolbarRegistry } from "./tab-bar-toolbar";

@Module({
  services: [
    Shell,
    SplitPositionHandler,
    TabBarToolbar,
    TabBarToolbarFactory,
    TabBarToolbarRegistry,
    LabelParser,
    LabelProvider,
    ViewContainer,
    HoverService,
    MarkdownRendererImpl,
    MarkdownRendererFactory,
    DefaultOpenerService,
  ],
})
export class ShellModule extends ServiceModule {}
