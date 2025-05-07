import { Signal } from "@lumino/signaling";
import { BoxLayout, BoxPanel, DockLayout, DockPanel, Panel, PanelLayout, SplitLayout, SplitPanel, TabBar, Title, Widget } from "@lumino/widgets";
import { find, map, some, toArray } from '@lumino/algorithm';
import { AttachedProperty } from '@lumino/properties';
import { MimeData } from '@lumino/coreutils';
import { Drag } from '@lumino/dragdrop';

import { DisposableCollection, Emitter, Event, IServiceContainer, InjectableService, createServiceDecorator, toDisposable } from "@gepick/core/common";
import { Mixin } from "ts-mixer";
import { UnsafeWidgetUtilities } from "../widget";
import { ITabBarRendererFactory, SideTabBar } from "./tab-bars";
import { SidebarMenu, SidebarMenuWidget } from "./sidebar-menu-widget";
import { ISidebarBottomMenuWidgetFactory, SidebarBottomMenuWidget } from "./sidebar-bottom-menu-widget";

export namespace SidePanel {
  /**
   * Options that control the behavior of side panels.
   */
  export interface Options {
    /**
     * When a widget is being dragged and the distance of the mouse cursor to the shell border
     * is below this threshold, the respective side panel is expanded so the widget can be dropped
     * into that panel. Set this to `-1` to disable expanding the side panel while dragging.
     */
    expandThreshold: number;
    /**
     * The duration in milliseconds of the animation shown when a side panel is expanded.
     * Set this to `0` to disable expansion animation.
     */
    expandDuration: number;
    /**
     * The ratio of the available shell size to use as initial size for the side panel.
     */
    initialSizeRatio: number;
    /**
     * How large the panel should be when it's expanded and empty.
     */
    emptySize: number;
  }

  /**
   * The options for adding a widget to a side panel.
   */
  export interface WidgetOptions {
    /**
     * The rank order of the widget among its siblings.
     */
    rank?: number;
  }

  /**
   * Data to save and load the layout of a side panel.
   */
  export interface LayoutData {
    type: 'sidepanel';
    items?: WidgetItem[];
    size?: number;
  }

  /**
   * Data structure used to save and restore the side panel layout.
   */
  export interface WidgetItem extends WidgetOptions {
    /** Can be undefined in case the widget could not be restored. */
    widget?: Widget;
    expanded?: boolean;
  }

  export interface State {
    /**
     * Indicates whether the panel is empty.
     */
    empty: boolean;
    /**
     * Indicates whether the panel is expanded, collapsed, or in a transition between the two.
     */
    expansion: ExpansionState;
    /**
     * A promise that is resolved when the currently pending side panel updates are done.
     */
    pendingUpdate: Promise<void>;
    /**
     * The index of the last tab that was selected. When the panel is expanded, it tries to restore
     * the tab selection to the previous state.
     */
    lastActiveTabIndex?: number;
    /**
     * The width or height of the panel before it was collapsed. When the panel is expanded, it tries
     * to restore its size to this value.
     */
    lastPanelSize?: number;
  }

  export enum ExpansionState {
    collapsed = 'collapsed',
    expanding = 'expanding',
    expanded = 'expanded',
    collapsing = 'collapsing',
  }
}

export const MAXIMIZED_CLASS = 'theia-maximized';
export const ACTIVE_TABBAR_CLASS = 'theia-tabBar-active';
export const VISIBLE_MENU_MAXIMIZED_CLASS = 'theia-visible-menu-maximized';

export const MAIN_AREA_ID = 'theia-main-content-panel';
export const BOTTOM_AREA_ID = 'theia-bottom-content-panel';

export class TheiaDockPanel extends DockPanel {
  /**
   * Emitted when a widget is added to the panel.
   */
  readonly widgetAdded = new Signal<this, Widget>(this);
  /**
   * Emitted when a widget is activated by calling `activateWidget`.
   */
  readonly widgetActivated = new Signal<this, Widget>(this);
  /**
   * Emitted when a widget is removed from the panel.
   */
  readonly widgetRemoved = new Signal<this, Widget>(this);

  protected readonly onDidToggleMaximizedEmitter = new Emitter<Widget>();
  readonly onDidToggleMaximized = this.onDidToggleMaximizedEmitter.event;
  protected readonly onDidChangeCurrentEmitter = new Emitter<Title<Widget> | undefined>();
  get onDidChangeCurrent(): Event<Title<Widget> | undefined> {
    return this.onDidChangeCurrentEmitter.event;
  }

  constructor(options?: DockPanel.IOptions, protected readonly preferences?: any,
  ) {
    super(options);
    // @ts-ignore
    this._onCurrentChanged = (sender: TabBar<Widget>, args: TabBar.ICurrentChangedArgs<Widget>) => {
      this.markAsCurrent(args.currentTitle || undefined);
      // @ts-ignore
      super._onCurrentChanged(sender, args);
    };
    // @ts-ignore
    this._onTabActivateRequested = (sender: TabBar<Widget>, args: TabBar.ITabActivateRequestedArgs<Widget>) => {
      this.markAsCurrent(args.title);
      // @ts-ignore
      super._onTabActivateRequested(sender, args);
    };
    if (preferences) {
      // @ts-ignore
      preferences.onPreferenceChanged((preference) => {
        if (!this.isElectron() && preference.preferenceName === 'window.menuBarVisibility' && (preference.newValue === 'visible' || preference.oldValue === 'visible')) {
          this.handleMenuBarVisibility(preference.newValue);
        }
      });
    }
  }

  isElectron(): boolean {
    return false;
  }

  protected handleMenuBarVisibility(newValue: string): void {
    const areaContainer = this.node.parentElement;
    const maximizedElement = this.getMaximizedElement();

    if (areaContainer === maximizedElement) {
      if (newValue === 'visible') {
        this.addClass(VISIBLE_MENU_MAXIMIZED_CLASS);
      }
      else {
        this.removeClass(VISIBLE_MENU_MAXIMIZED_CLASS);
      }
    }
  }

  protected _currentTitle: Title<Widget> | undefined;
  get currentTitle(): Title<Widget> | undefined {
    return this._currentTitle;
  }

  get currentTabBar(): TabBar<Widget> | undefined {
    return this._currentTitle && this.findTabBar(this._currentTitle);
  }

  findTabBar(title: Title<Widget>): TabBar<Widget> | undefined {
    return find(this.tabBars(), bar => bar.titles.includes(title));
  }

  protected readonly toDisposeOnMarkAsCurrent = new DisposableCollection();
  markAsCurrent(title: Title<Widget> | undefined): void {
    this.toDisposeOnMarkAsCurrent.dispose();
    this._currentTitle = title;
    this.markActiveTabBar(title);
    if (title) {
      const resetCurrent = () => this.markAsCurrent(undefined);
      title.owner.disposed.connect(resetCurrent);
      this.toDisposeOnMarkAsCurrent.push(toDisposable(() =>
        title.owner.disposed.disconnect(resetCurrent),
      ));
    }
    this.onDidChangeCurrentEmitter.fire(title);
  }

  markActiveTabBar(title?: Title<Widget>): void {
    const tabBars = toArray(this.tabBars());
    tabBars.forEach(tabBar => tabBar.removeClass(ACTIVE_TABBAR_CLASS));
    const activeTabBar = title && this.findTabBar(title);
    if (activeTabBar) {
      activeTabBar.addClass(ACTIVE_TABBAR_CLASS);
    }
    else if (tabBars.length > 0) {
      // At least one tabbar needs to be active
      tabBars[0].addClass(ACTIVE_TABBAR_CLASS);
    }
  }

  override addWidget(widget: Widget, options?: TheiaDockPanel.AddOptions): void {
    if (this.mode === 'single-document' && widget.parent === this) {
      return;
    }
    super.addWidget(widget, options);
    if (options?.closeRef) {
      options.ref?.close();
    }
    this.widgetAdded.emit(widget);
    this.markActiveTabBar(widget.title);
  }

  override activateWidget(widget: Widget): void {
    super.activateWidget(widget);
    this.widgetActivated.emit(widget);
    this.markActiveTabBar(widget.title);
  }

  protected override onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.widgetRemoved.emit(msg.child);
  }

  nextTabBarWidget(widget: Widget): Widget | undefined {
    const current = this.findTabBar(widget.title);
    const next = current && this.nextTabBarInPanel(current);
    return next && next.currentTitle && next.currentTitle.owner || undefined;
  }

  nextTabBarInPanel(tabBar: TabBar<Widget>): TabBar<Widget> | undefined {
    const tabBars = toArray(this.tabBars());
    const index = tabBars.indexOf(tabBar);
    if (index !== -1) {
      return tabBars[index + 1];
    }
    return undefined;
  }

  previousTabBarWidget(widget: Widget): Widget | undefined {
    const current = this.findTabBar(widget.title);
    const previous = current && this.previousTabBarInPanel(current);
    return previous && previous.currentTitle && previous.currentTitle.owner || undefined;
  }

  previousTabBarInPanel(tabBar: TabBar<Widget>): TabBar<Widget> | undefined {
    const tabBars = toArray(this.tabBars());
    const index = tabBars.indexOf(tabBar);
    if (index !== -1) {
      return tabBars[index - 1];
    }
    return undefined;
  }

  protected readonly toDisposeOnToggleMaximized = new DisposableCollection();
  toggleMaximized(): void {
    const areaContainer = this.node.parentElement;
    if (!areaContainer) {
      return;
    }
    const maximizedElement = this.getMaximizedElement();
    if (areaContainer === maximizedElement) {
      this.toDisposeOnToggleMaximized.dispose();
      return;
    }
    if (this.isAttached) {
      UnsafeWidgetUtilities.detach(this);
    }
    maximizedElement.style.display = 'block';
    this.addClass(MAXIMIZED_CLASS);
    const preference = this.preferences?.get('window.menuBarVisibility');
    if (!this.isElectron() && preference === 'visible') {
      this.addClass(VISIBLE_MENU_MAXIMIZED_CLASS);
    }
    UnsafeWidgetUtilities.attach(this, maximizedElement);
    this.fit();
    this.onDidToggleMaximizedEmitter.fire(this);
    this.toDisposeOnToggleMaximized.push(toDisposable(() => {
      maximizedElement.style.display = 'none';
      this.removeClass(MAXIMIZED_CLASS);
      this.onDidToggleMaximizedEmitter.fire(this);
      if (!this.isElectron()) {
        this.removeClass(VISIBLE_MENU_MAXIMIZED_CLASS);
      }
      if (this.isAttached) {
        UnsafeWidgetUtilities.detach(this);
      }
      UnsafeWidgetUtilities.attach(this, areaContainer);
      this.fit();
    }));

    const layout = this.layout;
    if (layout instanceof DockLayout) {
      // @ts-ignore
      const onResize = layout.onResize;
      // @ts-ignore
      layout.onResize = () => onResize.bind(layout)(Widget.ResizeMessage.UnknownSize);
      // @ts-ignore
      this.toDisposeOnToggleMaximized.push(toDisposable(() => layout.onResize = onResize));
    }

    const removedListener = () => {
      if (!this.widgets().next()) {
        this.toDisposeOnToggleMaximized.dispose();
      }
    };
    this.widgetRemoved.connect(removedListener);
    this.toDisposeOnToggleMaximized.push(toDisposable(() => this.widgetRemoved.disconnect(removedListener)));
  }

  protected maximizedElement: HTMLElement | undefined;
  protected getMaximizedElement(): HTMLElement {
    if (!this.maximizedElement) {
      this.maximizedElement = document.createElement('div');
      this.maximizedElement.style.display = 'none';
      document.body.appendChild(this.maximizedElement);
    }
    return this.maximizedElement;
  }
}

export namespace TheiaDockPanel {
  export const Factory = Symbol('TheiaDockPanel#Factory');
  export interface Factory {
    (options?: DockPanel.IOptions): TheiaDockPanel;
  }

  export interface AddOptions extends DockPanel.IAddOptions {
    /**
     * Whether to also close the widget referenced by `ref`.
     */
    closeRef?: boolean;
  }
}

export class SidePanelHandler extends InjectableService {
  /**
   * A property that can be attached to widgets in order to determine the insertion index
   * of their title in the tab bar.
   */
  protected static readonly rankProperty = new AttachedProperty<Widget, number | undefined>({
    name: 'sidePanelRank',
    create: () => undefined,
  });

  splitPositionHandler = new SplitPositionHandler();
  tabBar: SideTabBar;
  dockPanel: DockPanel;
  container: BoxPanel;
  /**
   * The menu placed on the sidebar bottom.
   * Displayed as icons.
   * Open menus when on clicks.
   */
  bottomMenu: SidebarMenuWidget;
  /**
   * Options that control the behavior of the side panel.
   */
  protected options: SidePanel.Options;
  /**
   * The current state of the side panel.
   */
  readonly state: SidePanel.State = {
    empty: true,
    expansion: SidePanel.ExpansionState.collapsed,
    pendingUpdate: Promise.resolve(),
  };

  constructor(
    @ISidebarBottomMenuWidgetFactory protected readonly sidebarBottomWidgetFactory: ISidebarBottomMenuWidgetFactory,
    @ITabBarRendererFactory protected readonly tabBarRendererFactory: ITabBarRendererFactory,
  ) {
    super();
  }

  /**
   * Create the side bar and dock panel widgets.
   */
  createSidePanel(options: SidePanel.Options): void {
    this.options = options;
    this.tabBar = this.createSideBar();
    this.dockPanel = this.createDockPanel();
    this.bottomMenu = this.createSidebarBottomMenu();
    this.container = this.createContainer();

    this.refresh();
  }

  createContainer() {
    const contentLayout = new BoxLayout({ direction: 'top-to-bottom', spacing: 0 });
    contentLayout.addWidget(this.dockPanel);
    const contentPanel = new BoxPanel({ layout: contentLayout });

    const sidebarLayout = new PanelLayout();
    sidebarLayout.addWidget(this.tabBar);
    sidebarLayout.addWidget(this.bottomMenu);
    const sidebarPanel = new Panel({ layout: sidebarLayout });
    sidebarPanel.addClass('theia-app-sidebar-container');

    const containerLayout = new BoxLayout({ direction: 'left-to-right', spacing: 0 });
    // 往container layout添加两个widget，分别是sidebarContainer和contentPanel
    containerLayout.addWidget(sidebarPanel);
    containerLayout.addWidget(contentPanel);

    BoxPanel.setStretch(sidebarPanel, 0);
    BoxPanel.setStretch(contentPanel, 1);
    const boxPanel = new BoxPanel({ layout: containerLayout });
    boxPanel.id = 'theia-left-content-panel';

    return boxPanel;
  }

  protected createSideBar(): SideTabBar {
    const tabBarRenderer = this.tabBarRendererFactory.createTabBarRenderer();
    const sideBar = new SideTabBar({
      // Tab bar options
      orientation: 'vertical',
      insertBehavior: 'none',
      removeBehavior: 'select-previous-tab',
      allowDeselect: false,
      tabsMovable: true,
      renderer: tabBarRenderer,
      // Scroll bar options
      handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
      useBothWheelAxes: true,
      scrollYMarginOffset: 8,
      suppressScrollX: true,
    });

    tabBarRenderer.tabBar = sideBar;
    sideBar.addClass('theia-app-left');
    sideBar.addClass('theia-app-sides');

    sideBar.tabAdded.connect((sender, { title }) => {
      const widget = title.owner;
      if (!some(this.dockPanel.widgets(), w => w === widget)) {
        this.dockPanel.addWidget(widget);
      }
    }, this);
    sideBar.tabCloseRequested.connect((sender, { title }) => title.owner.close());
    sideBar.collapseRequested.connect(() => { this.collapse(); }, this);
    sideBar.currentChanged.connect(this.handleCurrentTabChanged, this);
    sideBar.tabDetachRequested.connect(this.handleTabDetachRequested, this);

    return sideBar;
  }

  protected createDockPanel(): TheiaDockPanel {
    const sidePanel = new TheiaDockPanel({
      mode: 'single-document',
    });
    sidePanel.id = 'theia-left-side-panel';
    sidePanel.addClass('theia-side-panel');

    sidePanel.widgetActivated.connect((sender, widget) => {
      this.tabBar.currentTitle = widget.title;
    }, this);
    sidePanel.widgetAdded.connect(this.handleWidgetAdded, this);
    sidePanel.widgetRemoved.connect(this.handleWidgetRemoved, this);
    return sidePanel;
  }

  /**
   * Apply a side panel layout that has been previously created with `getLayoutData`.
   */
  setLayoutData(layoutData: SidePanel.LayoutData): void {
    // tslint:disable-next-line:no-null-keyword
    this.tabBar.currentTitle = null;

    let currentTitle: Title<Widget> | undefined;
    if (layoutData.items) {
      for (const { widget, rank, expanded } of layoutData.items) {
        if (widget) {
          if (rank) {
            SidePanelHandler.rankProperty.set(widget, rank);
          }
          if (expanded) {
            currentTitle = widget.title;
          }
          // Add the widgets directly to the tab bar in the same order as they are stored
          this.tabBar.addTab(widget.title);
        }
      }
    }
    if (layoutData.size) {
      this.state.lastPanelSize = layoutData.size;
    }

    // If the layout data contains an expanded item, update the currentTitle property
    // This implies a refresh through the `currentChanged` signal
    if (currentTitle) {
      this.tabBar.currentTitle = currentTitle;
    }
    else {
      this.refresh();
    }
  }

  /**
   * Create an object that describes the current side panel layout. This object may contain references
   * to widgets; these need to be transformed before the layout can be serialized.
   */
  getLayoutData(): SidePanel.LayoutData {
    const currentTitle = this.tabBar.currentTitle;
    const items = toArray(map(this.tabBar.titles, title => <SidePanel.WidgetItem>{
      widget: title.owner,
      rank: SidePanelHandler.rankProperty.get(title.owner),
      expanded: title === currentTitle,
    }));
    const size = currentTitle !== null ? this.getPanelSize() : this.state.lastPanelSize;
    return { type: 'sidepanel', items, size };
  }

  protected createSidebarBottomMenu(): SidebarBottomMenuWidget {
    const menu = this.sidebarBottomWidgetFactory.createSidebarBottomMenuWidget();
    menu.addClass('theia-sidebar-menu');

    return menu;
  }

  /**
   * Add a menu to the sidebar bottom.
   *
   * If the menu is already added, it will be ignored.
   */
  addBottomMenu(menu: SidebarMenu): void {
    this.bottomMenu.addMenu(menu);
  }

  /**
   * Remove a menu from the sidebar bottom.
   *
   * @param menuId id of the menu to remove
   */
  removeBottomMenu(menuId: string): void {
    this.bottomMenu.removeMenu(menuId);
  }

  /**
   * Refresh the visibility of the side bar and dock panel.
   */
  refresh(): void {
    const container = this.container;
    const parent = container.parent;
    const tabBar = this.tabBar;
    const dockPanel = this.dockPanel;
    const isEmpty = tabBar.titles.length === 0;
    const currentTitle = tabBar.currentTitle;
    const hideDockPanel = currentTitle === null;
    let relativeSizes: number[] | undefined;

    if (hideDockPanel) {
      container.addClass('theia-mod-collapsed');
      if (this.state.expansion === SidePanel.ExpansionState.expanded && !this.state.empty) {
        // Update the lastPanelSize property
        const size = this.getPanelSize();
        if (size) {
          this.state.lastPanelSize = size;
        }
      }
      this.state.expansion = SidePanel.ExpansionState.collapsed;
    }
    else {
      container.removeClass('theia-mod-collapsed');
      let size: number | undefined;
      if (this.state.expansion !== SidePanel.ExpansionState.expanded) {
        if (this.state.lastPanelSize) {
          size = this.state.lastPanelSize;
        }
        else {
          size = this.getDefaultPanelSize();
        }
      }

      if (size) {
        // Restore the panel size to the last known size or the default size
        this.state.expansion = SidePanel.ExpansionState.expanding;
        if (parent instanceof SplitPanel) {
          relativeSizes = parent.relativeSizes();
        }
        this.setPanelSize(size).then(() => {
          if (this.state.expansion === SidePanel.ExpansionState.expanding) {
            this.state.expansion = SidePanel.ExpansionState.expanded;
          }
        });
      }
      else {
        this.state.expansion = SidePanel.ExpansionState.expanded;
      }
    }
    container.setHidden(isEmpty && hideDockPanel);
    tabBar.setHidden(isEmpty);
    dockPanel.setHidden(hideDockPanel);
    this.state.empty = isEmpty;
    if (currentTitle) {
      dockPanel.selectWidget(currentTitle.owner);
    }
    if (relativeSizes && parent instanceof SplitPanel) {
      // Make sure that the expansion animation starts at the smallest possible size
      parent.setRelativeSizes(relativeSizes);
    }
  }

  /**
   * Modify the width of the panel. This implementation assumes that the parent of the panel
   * container is a `SplitPanel`.
   */
  protected setPanelSize(size: number): Promise<void> {
    const options: SplitPositionOptions = {
      side: 'left',
      duration: 0,
      referenceWidget: this.dockPanel,
    };
    const promise = this.splitPositionHandler.setSidePanelSize(this.container, size, options);
    const result = new Promise<void>((resolve) => {
      // Resolve the resulting promise in any case, regardless of whether resizing was successful
      promise.then(() => resolve(), () => resolve());
    });
    this.state.pendingUpdate = this.state.pendingUpdate.then(() => result);
    return result;
  }

  /**
   * Compute the current width of the panel. This implementation assumes that the parent of
   * the panel container is a `SplitPanel`.
   */
  protected getPanelSize(): number | undefined {
    const parent = this.container.parent;
    if (parent instanceof SplitPanel && parent.isVisible) {
      const index = parent.widgets.indexOf(this.container);
      const handle = parent.handles[index];
      if (!handle.classList.contains('lm-mod-hidden')) {
        return handle.offsetLeft;
      }
    }

    return undefined;
  }

  /**
   * Determine the default size to apply when the panel is expanded for the first time.
   */
  protected getDefaultPanelSize(): number | undefined {
    const parent = this.container.parent;
    if (parent && parent.isVisible) {
      return parent.node.clientWidth * this.options.initialSizeRatio;
    }

    return undefined;
  }

  /**
   * Activate a widget residing in the side panel by ID.
   *
   * @returns the activated widget if it was found
   */
  activate(id: string): Widget | undefined {
    const widget = this.expand(id);
    if (widget) {
      widget.activate();
    }
    return widget;
  }

  /**
   * Expand a widget residing in the side panel by ID. If no ID is given and the panel is
   * currently collapsed, the last active tab of this side panel is expanded. If no tab
   * was expanded previously, the first one is taken.
   *
   * @returns the expanded widget if it was found
   */
  expand(id?: string): Widget | undefined {
    if (id) {
      const widget = find(this.dockPanel.widgets(), w => w.id === id);
      if (widget) {
        this.tabBar.currentTitle = widget.title;
      }
      return widget;
    }
    else if (this.tabBar.currentTitle) {
      return this.tabBar.currentTitle.owner;
    }
    else if (this.tabBar.titles.length > 0) {
      let index = this.state.lastActiveTabIndex;
      if (!index) {
        index = 0;
      }
      else if (index >= this.tabBar.titles.length) {
        index = this.tabBar.titles.length - 1;
      }
      const title = this.tabBar.titles[index];
      this.tabBar.currentTitle = title;
      return title.owner;
    }
    else {
      // Reveal the tab bar and dock panel even if there is no widget
      // The next call to `refreshVisibility` will collapse them again
      this.state.expansion = SidePanel.ExpansionState.expanding;
      let relativeSizes: number[] | undefined;
      const parent = this.container.parent;
      if (parent instanceof SplitPanel) {
        relativeSizes = parent.relativeSizes();
      }
      this.container.removeClass('theia-mod-collapsed');
      this.container.show();
      this.tabBar.show();
      this.dockPanel.node.style.minWidth = '0';
      this.dockPanel.show();
      if (relativeSizes && parent instanceof SplitPanel) {
        // Make sure that the expansion animation starts at zero size
        parent.setRelativeSizes(relativeSizes);
      }
      this.setPanelSize(this.options.emptySize).then(() => {
        if (this.state.expansion === SidePanel.ExpansionState.expanding) {
          this.state.expansion = SidePanel.ExpansionState.expanded;
        }
      });
    }

    return undefined;
  }

  /**
   * Collapse the sidebar so no items are expanded.
   */
  collapse(): void {
    if (this.tabBar.currentTitle) {
      // tslint:disable-next-line:no-null-keyword
      this.tabBar.currentTitle = null;
    }
    else {
      this.refresh();
    }
  }

  /**
   * Sets the size of the side panel.
   *
   * @param size the desired size (width) of the panel in pixels.
   */
  resize(size: number): void {
    if (this.dockPanel.isHidden) {
      this.state.lastPanelSize = size;
    }
    else {
      this.setPanelSize(size);
    }
  }

  /**
   * Handle the `widgetAdded` signal from the dock panel. The widget's title is inserted into the
   * tab bar according to the `rankProperty` value that may be attached to the widget.
   */
  protected handleWidgetAdded(sender: DockPanel, widget: Widget): void {
    const titles = this.tabBar.titles;
    if (!find(titles, t => t.owner === widget)) {
      const rank = SidePanelHandler.rankProperty.get(widget);
      let index = titles.length;
      if (rank !== undefined) {
        for (let i = index - 1; i >= 0; i--) {
          const r = SidePanelHandler.rankProperty.get(titles[i].owner);
          if (r !== undefined && r > rank) {
            index = i;
          }
        }
      }
      this.tabBar.insertTab(index, widget.title);

    //   this.refresh();
    }
  }

  /**
   * Handle the `widgetRemoved` signal from the dock panel. The widget's title is also removed
   * from the tab bar.
   */
  protected handleWidgetRemoved(sender: DockPanel, widget: Widget): void {
    this.tabBar.removeTab(widget.title);
    this.refresh();
  }

  /**
   * Handle a `currentChanged` signal from the sidebar. The side panel is refreshed so it displays
   * the new selected widget.
   */
  protected handleCurrentTabChanged(sender: SideTabBar, { currentIndex }: TabBar.ICurrentChangedArgs<Widget>): void {
    if (currentIndex >= 0) {
      this.state.lastActiveTabIndex = currentIndex;
      sender.revealTab(currentIndex);
    }
    this.refresh();
  }

  /**
   * Handle a `tabDetachRequested` signal from the sidebar. A drag is started so the widget can be
   * moved to another application shell area.
   */
  protected handleTabDetachRequested(sender: SideTabBar, { title, tab, clientX, clientY }: TabBar.ITabDetachRequestedArgs<Widget>): void {
    // Release the tab bar's hold on the mouse
    sender.releaseMouse();

    // Clone the selected tab and use that as drag image
    const clonedTab = tab.cloneNode(true) as HTMLElement;
    clonedTab.style.width = '';
    clonedTab.style.height = '';
    const label = clonedTab.getElementsByClassName('lm-TabBar-tabLabel')[0] as HTMLElement;
    label.style.width = '';
    label.style.height = '';

    // Create and start a drag to move the selected tab to another panel
    const mimeData = new MimeData();
    mimeData.setData('application/vnd.lumino.widget-factory', () => title.owner);
    const drag = new Drag({
      mimeData,
      dragImage: clonedTab,
      proposedAction: 'move',
      supportedActions: 'move',
    });

    tab.classList.add('lm-mod-hidden');
    drag.start(clientX, clientY).then(() => {
      // The promise is resolved when the drag has ended
      tab.classList.remove('lm-mod-hidden');
    });
  }

  /**
   * Add a widget and its title to the dock panel and side bar.
   *
   * If the widget is already added, it will be moved.
   */
  addWidget(widget: Widget, options: SidePanel.WidgetOptions): void {
    if (options.rank) {
      SidePanelHandler.rankProperty.set(widget, options.rank);
    }
    this.dockPanel.addWidget(widget);
  }
}

export class SidePanelHandlerFactory extends InjectableService {
  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createSidePanelHandler() {
    const child = this.serviceContainer.createChild();

    child.bind(SidePanelHandler.getServiceId()).to(SidePanelHandler);

    return child.get<SidePanelHandler>(SidePanelHandler.getServiceId());
  }
}
export const ISidePanelHandlerFactory = createServiceDecorator<ISidePanelHandlerFactory>(SidePanelHandlerFactory.name);
export type ISidePanelHandlerFactory = SidePanelHandlerFactory;

export interface SplitPositionOptions {
  /** The side of the side panel that shall be resized. */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** The duration in milliseconds, or 0 for no animation. */
  duration: number;
  /** When this widget is hidden, the animation is canceled. */
  referenceWidget?: Widget;
}

export interface MoveEntry extends SplitPositionOptions {
  parent: SplitPanel;
  index: number;
  started: boolean;
  ended: boolean;
  targetSize?: number;
  targetPosition?: number;
  startPosition?: number;
  startTime?: number;
  resolve?: (position: number) => void;
  reject?: (reason: string) => void;
}

export class SplitPositionHandler extends InjectableService {
  private readonly splitMoves: MoveEntry[] = [];
  private currentMoveIndex: number = 0;

  /**
   * Set the position of a split handle asynchronously. This function makes sure that such movements
   * are performed one after another in order to prevent the movements from overriding each other.
   * When resolved, the returned promise yields the final position of the split handle.
   */
  setSplitHandlePosition(parent: SplitPanel, index: number, targetPosition: number, options: SplitPositionOptions): Promise<number> {
    const move: MoveEntry = {
      ...options,
      parent,
      targetPosition,
      index,
      started: false,
      ended: false,
    };
    return this.moveSplitPos(move);
  }

  /**
   * Resize a side panel asynchronously. This function makes sure that such movements are performed
   * one after another in order to prevent the movements from overriding each other.
   * When resolved, the returned promise yields the final position of the split handle.
   */
  setSidePanelSize(sidePanel: Widget, targetSize: number, options: SplitPositionOptions): Promise<number> {
    if (targetSize < 0) {
      return Promise.reject(new Error('Cannot resize to negative value.'));
    }
    const parent = sidePanel.parent;
    if (!(parent instanceof SplitPanel)) {
      return Promise.reject(new Error('Widget must be contained in a SplitPanel.'));
    }
    let index = parent.widgets.indexOf(sidePanel);
    if (index > 0 && (options.side === 'right' || options.side === 'bottom')) {
      index--;
    }
    const move: MoveEntry = {
      ...options,
      parent,
      targetSize,
      index,
      started: false,
      ended: false,
    };
    return this.moveSplitPos(move);
  }

  protected moveSplitPos(move: MoveEntry): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      move.resolve = resolve;
      move.reject = reject;
      if (this.splitMoves.length === 0) {
        setTimeout(this.animationFrame.bind(this), 10);
      }
      this.splitMoves.push(move);
    });
  }

  protected animationFrame(): void {
    const time = Date.now();
    const move = this.splitMoves[this.currentMoveIndex];
    let rejectedOrResolved = false;
    if (move.ended || move.referenceWidget && move.referenceWidget.isHidden) {
      this.splitMoves.splice(this.currentMoveIndex, 1);
      if (move.startPosition === undefined || move.targetPosition === undefined) {
        move.reject!('Panel is not visible.');
      }
      else {
        move.resolve!(move.targetPosition);
      }
      rejectedOrResolved = true;
    }
    else if (!move.started) {
      this.startMove(move, time);
      if (move.duration <= 0 || move.startPosition === undefined || move.targetPosition === undefined
        || move.startPosition === move.targetPosition) {
        this.endMove(move);
      }
    }
    else {
      const elapsedTime = time - move.startTime!;
      if (elapsedTime >= move.duration) {
        this.endMove(move);
      }
      else {
        const t = elapsedTime / move.duration;
        const start = move.startPosition || 0;
        const target = move.targetPosition || 0;
        const pos = start + (target - start) * t;
        (move.parent.layout as SplitLayout).moveHandle(move.index, pos);
      }
    }
    if (!rejectedOrResolved) {
      this.currentMoveIndex++;
    }
    if (this.currentMoveIndex >= this.splitMoves.length) {
      this.currentMoveIndex = 0;
    }
    if (this.splitMoves.length > 0) {
      setTimeout(this.animationFrame.bind(this));
    }
  }

  protected startMove(move: MoveEntry, time: number): void {
    if (move.targetPosition === undefined && move.targetSize !== undefined) {
      const { clientWidth, clientHeight } = move.parent.node;
      if (clientWidth && clientHeight) {
        switch (move.side) {
          case 'left':
            move.targetPosition = Math.max(Math.min(move.targetSize, clientWidth), 0);
            break;
          case 'right':
            move.targetPosition = Math.max(Math.min(clientWidth - move.targetSize, clientWidth), 0);
            break;
          case 'top':
            move.targetPosition = Math.max(Math.min(move.targetSize, clientHeight), 0);
            break;
          case 'bottom':
            move.targetPosition = Math.max(Math.min(clientHeight - move.targetSize, clientHeight), 0);
            break;
        }
      }
    }
    if (move.startPosition === undefined) {
      move.startPosition = this.getCurrentPosition(move);
    }
    move.startTime = time;
    move.started = true;
  }

  protected endMove(move: MoveEntry): void {
    if (move.targetPosition !== undefined) {
      (move.parent.layout as SplitLayout).moveHandle(move.index, move.targetPosition);
    }
    move.ended = true;
  }

  protected getCurrentPosition(move: MoveEntry): number | undefined {
    const layout = move.parent.layout as SplitLayout;
    let pos: number | null;
    if (layout.orientation === 'horizontal') {
      pos = layout.handles[move.index].offsetLeft;
    }
    else {
      pos = layout.handles[move.index].offsetTop;
    }
    if (pos !== null) {
      return pos;
    }
    else {
      return undefined;
    }
  }
}
export const ISplitPositionHandler = createServiceDecorator<ISplitPositionHandler>(SplitPositionHandler.name);
export type ISplitPositionHandler = SplitPositionHandler;

export class AbstractPanel extends Mixin(Panel, InjectableService) {}
