import { IServiceContainer, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { DockLayout, DockPanel, TabBar, Widget } from "../widget";
import { ITabBarRendererFactory, ScrollableTabBar } from "./tab-bars";

/**
 * A renderer for dock panels that supports context menus on tabs.
 */
export class DockPanelRenderer extends InjectableService implements DockLayout.IRenderer {
  readonly tabBarClasses: string[] = [];

  constructor(
      @ITabBarRendererFactory protected readonly tabBarRendererFactory: ITabBarRendererFactory,
  ) {
    super();
  }

  createTabBar(): TabBar<Widget> {
    const renderer = this.tabBarRendererFactory.createTabBarRenderer();
    const tabBar = new ScrollableTabBar({
      renderer,
      // Scroll bar options
      handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
      useBothWheelAxes: true,
      scrollXMarginOffset: 4,
      suppressScrollY: true,
    });
    this.tabBarClasses.forEach(c => tabBar.addClass(c));
    renderer.tabBar = tabBar;
    tabBar.currentChanged.connect(this.handleCurrentTabChanged, this);
    return tabBar;
  }

  createHandle(): HTMLDivElement {
    return DockPanel.defaultRenderer.createHandle();
  }

  protected handleCurrentTabChanged(sender: ScrollableTabBar, { currentIndex }: TabBar.ICurrentChangedArgs<Widget>): void {
    if (currentIndex >= 0) {
      sender.revealTab(currentIndex);
    }
  }
}

export class DockPanelRendererFactory extends InjectableService {
  constructor(
      @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createDockPanelRenderer() {
    const child = this.serviceContainer.createChild();
    child.bind(DockPanelRenderer.getServiceId()).to(DockPanelRenderer);

    return child.get<DockPanelRenderer>(DockPanelRenderer.getServiceId());
  }
}
export const IDockPanelRendererFactory = createServiceDecorator<IDockPanelRendererFactory>(DockPanelRendererFactory.name);
export type IDockPanelRendererFactory = DockPanelRendererFactory;
