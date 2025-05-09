import { IServiceContainer, InjectableService, MenuPath, createServiceDecorator } from '@gepick/core/common';
import { SidebarMenuWidget } from './sidebar-menu-widget';

/**
 * The menu widget placed on the bottom of the sidebar.
 */
export class SidebarBottomMenuWidget extends SidebarMenuWidget {
  protected override onClick(e: React.MouseEvent<HTMLElement, MouseEvent>, menuPath: MenuPath): void {
    const button = e.currentTarget.getBoundingClientRect();
    this.contextMenuRenderer.render({
      menuPath,
      includeAnchorArg: false,
      anchor: {
        x: button.left + button.width,
        y: button.top + button.height,
      },
      context: e.currentTarget,
    });
  }
}
export const ISidebarBottomMenuWidget = createServiceDecorator<ISidebarBottomMenuWidget>(SidebarBottomMenuWidget.name);
export type ISidebarBottomMenuWidget = SidebarBottomMenuWidget;

export class SidebarBottomMenuWidgetFactory extends InjectableService {
  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createSidebarBottomMenuWidget() {
    return this.serviceContainer.get<ISidebarBottomMenuWidget>(ISidebarBottomMenuWidget);
  }
}

export const ISidebarBottomMenuWidgetFactory = createServiceDecorator<ISidebarBottomMenuWidgetFactory>(SidebarBottomMenuWidgetFactory.name);
export type ISidebarBottomMenuWidgetFactory = SidebarBottomMenuWidgetFactory;
