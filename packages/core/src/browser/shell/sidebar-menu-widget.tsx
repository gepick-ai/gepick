import { DisposableCollection, Emitter, Event, MenuPath } from "@gepick/core/common";
import React from "react";
import { AbstractReactWidget } from "../widget";
import { IContextMenuRenderer } from "../menu";
import { IHoverService } from "../services";

export const SidebarTopMenuWidgetFactory = Symbol('SidebarTopMenuWidgetFactory');
export const SidebarBottomMenuWidgetFactory = Symbol('SidebarBottomMenuWidgetFactory');

export interface SidebarMenu {
  id: string;
  iconClass: string;
  title: string;
  menuPath: MenuPath;
  onDidBadgeChange?: Event<number>;
  /*
     * Used to sort menus. The lower the value the lower they are placed in the sidebar.
     */
  order: number;
}

export class SidebarMenuItem {
  readonly menu: SidebarMenu;
  get badge(): string {
    if (this._badge <= 0) {
      return '';
    }
    else if (this._badge > 99) {
      return '99+';
    }
    else {
      return this._badge.toString();
    }
  };

  protected readonly onDidBadgeChangeEmitter = new Emitter<number>();
  readonly onDidBadgeChange: Event<number> = this.onDidBadgeChangeEmitter.event;
  protected _badge = 0;

  protected readonly toDispose = new DisposableCollection();

  constructor(menu: SidebarMenu) {
    this.menu = menu;
    if (menu.onDidBadgeChange) {
      this.toDispose.push(menu.onDidBadgeChange((value) => {
        this._badge = value;
        this.onDidBadgeChangeEmitter.fire(value);
      }));
    }
  }

  dispose(): void {
    this.toDispose.dispose();
    this.onDidBadgeChangeEmitter.dispose();
  }
}

/**
 * The menu widget placed on the sidebar.
 */
export class SidebarMenuWidget extends AbstractReactWidget {
  protected readonly items: SidebarMenuItem[];
  /**
   * The element that had focus when a menu rendered by this widget was activated.
   */
  protected preservedContext: HTMLElement | undefined;
  /**
   * Flag indicating whether a context menu is open. While a context menu is open, the `preservedContext` should not be cleared.
   */
  protected preservingContext = false;

  constructor(
    @IContextMenuRenderer protected readonly contextMenuRenderer: IContextMenuRenderer,
    @IHoverService protected readonly hoverService: IHoverService,
  ) {
    super();
    this.items = [];
  }

  addMenu(menu: SidebarMenu): void {
    const exists = this.items.find(item => item.menu.id === menu.id);
    if (exists) {
      return;
    }
    const newItem = new SidebarMenuItem(menu);
    newItem.onDidBadgeChange(() => this.update());
    this.items.push(newItem);
    this.items.sort((a, b) => a.menu.order - b.menu.order);
    this.update();
  }

  removeMenu(menuId: string): void {
    const index = this.items.findIndex(m => m.menu.id === menuId);
    if (index !== -1) {
      this.items[index].dispose();
      this.items.splice(index, 1);
      this.update();
    }
  }

  protected readonly onMouseDown = () => {
    const { activeElement } = document;
    if (activeElement instanceof HTMLElement && !this.node.contains(activeElement)) {
      this.preservedContext = activeElement;
    }
  };

  protected readonly onMouseOut = () => {
    if (!this.preservingContext) {
      this.preservedContext = undefined;
    }
  };

  protected readonly onMouseEnter = (event: React.MouseEvent<HTMLElement, MouseEvent>, title: string) => {
    if (title && event.nativeEvent.currentTarget) {
      this.hoverService.requestHover({
        content: title,
        target: event.currentTarget,
        position: 'right',
      });
    }
  };

  protected onClick(e: React.MouseEvent<HTMLElement, MouseEvent>, menuPath: MenuPath): void {
    this.preservingContext = true;
    const button = e.currentTarget.getBoundingClientRect();

    this.contextMenuRenderer.render({
      menuPath,
      includeAnchorArg: false,
      anchor: {
        x: button.left + button.width,
        y: button.top,
      },
      context: e.currentTarget,
      onHide: () => {
        this.preservingContext = false;
        if (this.preservedContext) {
          this.preservedContext.focus({ preventScroll: true });
          this.preservedContext = undefined;
        }
      },
    });
  }

  protected render(): React.ReactNode {
    return (
      <React.Fragment>
        {this.items.map(item => this.renderItem(item))}
      </React.Fragment>
    );
  }

  protected renderItem(item: SidebarMenuItem): React.ReactNode {
    return (
      <div
        key={item.menu.id}
        className="theia-sidebar-menu-item"
        onClick={e => this.onClick(e, item.menu.menuPath)}
        onMouseDown={this.onMouseDown}
        onMouseEnter={e => this.onMouseEnter(e, item.menu.title)}
        onMouseLeave={this.onMouseOut}
      >
        <i className={item.menu.iconClass} />
        {item.badge && <div className="theia-badge-decorator-sidebar">{item.badge}</div>}
      </div>
    );
  }
}
