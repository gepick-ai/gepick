import { Module, ServiceModule } from "@gepick/core/common";
import { LabelParser, LabelProvider } from "../label";
import { HoverService } from "../services";
import { MarkdownRendererFactory, MarkdownRendererImpl } from "../markdown";
import { DefaultOpenerService } from "../opener";
import { ColorRegistry } from "../services/color-registry";
import { DecorationsServiceImpl } from "../services/decorations-service";
import { SidePanelHandlerFactory, SplitPositionHandler } from "./side-panel-handler";
import { Shell } from "./shell";
import { ViewContainer } from "./view/view-container";
import { TabBarToolbar, TabBarToolbarFactory, TabBarToolbarRegistry } from "./tab-bar-toolbar";
import { SidebarBottomMenuWidget, SidebarBottomMenuWidgetFactory } from "./sidebar-bottom-menu-widget";
import { TabBarRendererFactory } from "./tab-bars";
import { TabBarDecoratorService } from "./tab-bar-decorator";
import { DockPanelRendererFactory } from "./dock-panel";

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
    SidebarBottomMenuWidget,
    SidebarBottomMenuWidgetFactory,
    SidePanelHandlerFactory,
    TabBarRendererFactory,
    TabBarDecoratorService,
    ColorRegistry,
    DecorationsServiceImpl,
    DockPanelRendererFactory,
  ],

})
export class ShellModule extends ServiceModule {}
