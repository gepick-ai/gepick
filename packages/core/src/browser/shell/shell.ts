import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { Signal } from "@lumino/signaling";
import { ArrayExt, find, toArray } from "@lumino/algorithm";
import { IDragEvent } from "@lumino/dragdrop";
import { BaseWidget, BoxLayout, BoxPanel, DockLayout, DockPanel, FocusTracker, Layout, Message, SplitLayout, SplitPanel, TabBar, Widget } from "../widgets";
import { GepickDockPanel, SidePanel, SidePanelHandler } from "./side-panel";
import { ScrollableTabBar, TabBarRenderer } from "./tab-bars";

/**
 * Data stored while dragging widgets in the shell.
 */
interface WidgetDragState {
  startTime: number;
  leftExpanded: boolean;
  lastDragOver?: IDragEvent;
  leaveTimeout?: number;
}

/** The class name added to ApplicationShell instances. */
const APPLICATION_SHELL_CLASS = 'theia-ApplicationShell';
/** The class name added to the main and bottom area panels. */
const MAIN_BOTTOM_AREA_CLASS = 'theia-app-centers';

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

/**
 * A renderer for dock panels that supports context menus on tabs.
 */
export class DockPanelRenderer implements DockLayout.IRenderer {
  readonly tabBarClasses: string[] = [];

  createTabBar(): TabBar<Widget> {
    const renderer = new TabBarRenderer();
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

/**
 * The namespace for `ApplicationShell` class statics.
 */
export namespace ApplicationShell1 {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'left';

  /**
   * The _side areas_ are those shell areas that can be collapsed and expanded,
   * i.e. `left`, `right`, and `bottom`.
   */
  export function isSideArea(area?: Area): area is 'left' {
    return area === 'left';
  }

  /**
   * General options for the application shell. These are passed on construction and can be modified
   * through dependency injection (`ApplicationShellOptions` symbol).
   */
  export interface Options extends Widget.IOptions {
    bottomPanel: BottomPanelOptions;
    leftPanel: SidePanel.Options;
    rightPanel: SidePanel.Options;
  }

  export interface BottomPanelOptions extends SidePanel.Options {
  }

  /**
   * The default values for application shell options.
   */
  export const DEFAULT_OPTIONS = Object.freeze(<Options>{
    bottomPanel: Object.freeze(<BottomPanelOptions>{
      emptySize: 140,
      expandThreshold: 160,
      expandDuration: 150,
      initialSizeRatio: 0.382,
    }),
    leftPanel: Object.freeze(<SidePanel.Options>{
      emptySize: 140,
      expandThreshold: 140,
      expandDuration: 150,
      initialSizeRatio: 0.191,
    }),
    rightPanel: Object.freeze(<SidePanel.Options>{
      emptySize: 140,
      expandThreshold: 140,
      expandDuration: 150,
      initialSizeRatio: 0.191,
    }),
  });

  /**
   * Options for adding a widget to the application shell.
   */
  export interface WidgetOptions extends DockLayout.IAddOptions, SidePanel.WidgetOptions {
    /**
     * The area of the application shell where the widget will reside.
     */
    area: Area;
  }

  /**
   * Data to save and load the application shell layout.
   */
  export interface LayoutData {
    version?: string;
    mainPanel?: DockPanel.ILayoutConfig;
    bottomPanel?: BottomPanelLayoutData;
    leftPanel?: SidePanel.LayoutData;
    rightPanel?: SidePanel.LayoutData;
    activeWidgetId?: string;
  }

  /**
   * Data to save and load the bottom panel layout.
   */
  export interface BottomPanelLayoutData {
    config?: DockPanel.ILayoutConfig;
    size?: number;
    expanded?: boolean;
  }
}

export class ApplicationShell extends BaseWidget {
  /**
   * Handler for the left side panel. The primary application views go here, such as the
   * file explorer and the git view.
   */
  leftPanelHandler: SidePanelHandler;
  leftPanel: BoxPanel;
  mainPanel: DockPanel;
  options: ApplicationShell1.Options = {
    bottomPanel: {
      ...ApplicationShell1.DEFAULT_OPTIONS.bottomPanel,
    },
    leftPanel: {
      ...ApplicationShell1.DEFAULT_OPTIONS.leftPanel,
    },
    rightPanel: {
      ...ApplicationShell1.DEFAULT_OPTIONS.rightPanel,
    },
  };

  private dragState?: WidgetDragState;
  private readonly tracker = new FocusTracker<Widget>();
  /**
   * A signal emitted whenever the `currentWidget` property is changed.
   */
  readonly currentChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);

  /**
   * A signal emitted whenever the `activeWidget` property is changed.
   */
  readonly activeChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);

  /**
   * The current widget in the application shell. The current widget is the last widget that
   * was active and not yet closed. See the remarks to `activeWidget` on what _active_ means.
   */
  get currentWidget(): Widget | undefined {
    return this.tracker.currentWidget || undefined;
  }

  /**
   * The active widget in the application shell. The active widget is the one that has focus
   * (either the widget itself or any of its contents).
   *
   * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * does not take any focus; in that case the widget is never returned by this property.
   */
  get activeWidget(): Widget | undefined {
    return this.tracker.activeWidget || undefined;
  }

  /**
   * The shell area name of the currently active tab, or undefined.
   */
  get currentTabArea(): ApplicationShell1.Area | undefined {
    const currentWidget = this.currentWidget;
    if (currentWidget) {
      return this.getAreaFor(currentWidget);
    }

    return undefined;
  }

  /**
   * Return the tab bar that has the currently active widget, or undefined.
   */
  get currentTabBar(): TabBar<Widget> | undefined {
    const currentWidget = this.currentWidget;
    if (currentWidget) {
      return this.getTabBarFor(currentWidget);
    }

    return undefined;
  }

  /**
   * The tab bars contained in the main shell area. If there is no widget in the main area, the
   * returned array is empty.
   */
  get mainAreaTabBars(): TabBar<Widget>[] {
    return toArray(this.mainPanel.tabBars());
  }

  /**
   * The tab bars contained in all shell areas.
   */
  get allTabBars(): TabBar<Widget>[] {
    return [...this.mainAreaTabBars, this.leftPanelHandler.tabBar];
  }

  @PostConstruct()
  protected init(): void {
    this.id = 'theia-app-shell';
    this.addClass(APPLICATION_SHELL_CLASS);
    this.layout = this.createLayout();

    this.tracker.currentChanged.connect(this.handleCurrentChanged, this);
    this.tracker.activeChanged.connect(this.handleActiveChanged, this);
  }

  protected createLayout(): Layout {
    // Left Panel
    this.leftPanel = this.createSidePanel();

    // Main Panel
    this.mainPanel = this.createMainPanel();

    // 创建一个左中右分割布局面板
    const leftRightLayoutPanel = new SplitPanel({ layout: this.createSplitLayout([this.leftPanel, this.mainPanel], [1, 3], { orientation: 'horizontal', spacing: 0 }) });
    leftRightLayoutPanel.id = 'theia-left-right-split-panel';

    // 创建一个从上到下的单列布局
    const boxLayout = this.createBoxLayout([leftRightLayoutPanel], [1], { direction: 'top-to-bottom', spacing: 0 });

    return boxLayout;
  }

  protected createSidePanel(): BoxPanel {
    const sidebarHandler = new SidePanelHandler();
    sidebarHandler.createSidePanel(this.options.leftPanel);
    this.leftPanelHandler = sidebarHandler;
    return sidebarHandler.container;
  }

  /**
   * Create the dock panel in the main shell area.
   */
  protected createMainPanel(): DockPanel {
    const renderer = new DockPanelRenderer();
    renderer.tabBarClasses.push(MAIN_BOTTOM_AREA_CLASS);
    const dockPanel = new GepickDockPanel({
      mode: 'multiple-document',
      renderer,
      spacing: 0,
    });

    dockPanel.id = 'theia-main-content-panel';

    return dockPanel;
  }

  /**
   * Create a box layout to assemble the application shell layout.
   *
   * 一个Box Layout布局会将Widget按照一行或者一列排列
   */
  protected createBoxLayout(widgets: Widget[], stretch?: number[], options?: BoxPanel.IOptions): BoxLayout {
    const boxLayout = new BoxLayout(options);
    for (let i = 0; i < widgets.length; i++) {
      if (stretch !== undefined && i < stretch.length) {
        BoxPanel.setStretch(widgets[i], stretch[i]); // 对Widget进行空间分配
      }
      boxLayout.addWidget(widgets[i]);
    }
    return boxLayout;
  }

  /**
   * Create a split layout to assemble the application shell layout.
   */
  protected createSplitLayout(widgets: Widget[], stretch?: number[], options?: Partial<SplitLayout.IOptions>): SplitLayout {
    let optParam: SplitLayout.IOptions = { renderer: SplitPanel.defaultRenderer };
    if (options) {
      optParam = { ...optParam, ...options };
    }
    const splitLayout = new SplitLayout(optParam);
    for (let i = 0; i < widgets.length; i++) {
      if (stretch !== undefined && i < stretch.length) {
        SplitPanel.setStretch(widgets[i], stretch[i]);
      }
      splitLayout.addWidget(widgets[i]);
    }
    return splitLayout;
  }

  /**
   * Track all widgets that are referenced by the given layout data.
   */
  protected registerWithFocusTracker(data: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig | SidePanel.LayoutData | null): void {
    if (data) {
      if (data.type === 'tab-area') {
        for (const widget of data.widgets) {
          if (widget) {
            this.track(widget);
          }
        }
      }
      else if (data.type === 'split-area') {
        for (const child of data.children) {
          this.registerWithFocusTracker(child);
        }
      }
      else if (data.type === 'sidepanel' && data.items) {
        for (const item of data.items) {
          if (item.widget) {
            this.track(item.widget);
          }
        }
      }
    }
  }

  /**
   * Track the given widget so it is considered in the `current` and `active` state of the shell.
   */
  protected track(widget: Widget): void {
    this.tracker.add(widget);
  }

  /**
   * Handle a change to the current widget.
   */
  private handleCurrentChanged(sender: FocusTracker<Widget>, args: FocusTracker.IChangedArgs<Widget>): void {
    this.currentChanged.emit(args);
  }

  /**
   * Handle a change to the active widget.
   */
  private handleActiveChanged(sender: FocusTracker<Widget>, args: FocusTracker.IChangedArgs<Widget>): void {
    const { newValue, oldValue } = args;
    if (oldValue) {
      // Remove the mark of the previously active widget
      oldValue.title.className = oldValue.title.className.replace(' theia-mod-active', '');
      // Reset the z-index to the default
      // tslint:disable-next-line:no-null-keyword
      this.setZIndex(oldValue.node, null);
    }
    if (newValue) {
      // Mark the tab of the active widget
      newValue.title.className += ' theia-mod-active';
      // Reveal the title of the active widget in its tab bar
      const tabBar = this.getTabBarFor(newValue);
      if (tabBar instanceof ScrollableTabBar) {
        const index = tabBar.titles.indexOf(newValue.title);
        if (index >= 0) {
          tabBar.revealTab(index);
        }
      }
      // Set the z-index so elements with `position: fixed` contained in the active widget are displayed correctly
      this.setZIndex(newValue.node, '1');
    }
    this.activeChanged.emit(args);
  }

  /**
   * Set the z-index of the given element and its ancestors to the value `z`.
   */
  private setZIndex(element: any, z: string | null) {
    element.style.zIndex = z;
    const parent = element.parentElement;
    if (parent && parent !== this.node) {
      this.setZIndex(parent, z);
    }
  }

  /**
   * Return the tab bar in the given shell area, or the tab bar that has the given widget, or undefined.
   */
  getTabBarFor(widgetOrArea: Widget | ApplicationShell1.Area): TabBar<Widget> | undefined {
    if (typeof widgetOrArea === 'string') {
      switch (widgetOrArea) {
        case 'left':
          return this.leftPanelHandler.tabBar;
        default:
          throw new Error(`Illegal argument: ${widgetOrArea}`);
      }
    }
    else if (widgetOrArea && widgetOrArea.isAttached) {
      const widgetTitle = widgetOrArea.title;

      const leftPanelTabBar = this.leftPanelHandler.tabBar;
      if (ArrayExt.firstIndexOf(leftPanelTabBar.titles, widgetTitle) > -1) {
        return leftPanelTabBar;
      }

      const mainPanelTabBar = find(this.mainPanel.tabBars(), bar => ArrayExt.firstIndexOf(bar.titles, widgetTitle) > -1);
      if (mainPanelTabBar) {
        return mainPanelTabBar;
      }
    }
    return undefined;
  }

  /**
   * Add a widget to the application shell. The given widget must have a unique `id` property,
   * which will be used as the DOM id.
   *
   * Widgets are removed from the shell by calling their `close` or `dispose` methods.
   *
   * Widgets added to the top area are not tracked regarding the _current_ and _active_ states.
   */
  addWidget(widget: Widget, options: ApplicationShell1.WidgetOptions) {
    if (!widget.id) {
      console.error('Widgets added to the application shell must have a unique id property.');
      return;
    }
    switch (options.area) {
      case 'main':
        this.mainPanel.addWidget(widget, options);
        break;
      case 'left':
        this.leftPanelHandler.addWidget(widget, options);
        break;

      default:
        throw new Error(`Illegal argument: ${options.area}`);
    }
    this.track(widget);
  }

  /**
   * The widgets contained in the given shell area.
   */
  getWidgets(area: ApplicationShell1.Area): Widget[] {
    switch (area) {
      case 'main':
        return toArray(this.mainPanel.widgets());
      case 'left':
        return toArray(this.leftPanelHandler.dockPanel.widgets());
      default:
        throw new Error(`Illegal argument: ${area}`);
    }
  }

  /**
   * Activate a widget in the application shell. This makes the widget visible and usually
   * also assigns focus to it.
   *
   * _Note:_ Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * does not take any focus.
   *
   * @returns the activated widget if it was found
   */
  activateWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), w => w.id === id);
    if (widget) {
      this.mainPanel.activateWidget(widget);
      return this.checkActivation(widget);
    }

    widget = this.leftPanelHandler.activate(id);
    if (widget) {
      return this.checkActivation(widget);
    }

    return undefined;
  }

  /**
   * Focus is taken by a widget through the `onActivateRequest` method. It is up to the
   * widget implementation which DOM element will get the focus. The default implementation
   * of Widget does not take any focus. This method can help finding such problems by logging
   * a warning in case a widget was explicitly activated, but did not trigger a change of the
   * `activeWidget` property.
   */
  private checkActivation(widget: Widget): Widget {
    // eslint-disable-next-line dot-notation
    const onActivateRequest = widget['onActivateRequest'].bind(widget);
    // eslint-disable-next-line dot-notation
    widget['onActivateRequest'] = (msg: Message) => {
      onActivateRequest(msg);
    };
    return widget;
  }

  /**
   * Reveal a widget in the application shell. This makes the widget visible,
   * but does not activate it.
   *
   * @returns the revealed widget if it was found
   */
  revealWidget(id: string): Widget | undefined {
    let widget = find(this.mainPanel.widgets(), w => w.id === id);

    if (widget) {
      const tabBar = this.getTabBarFor(widget);
      if (tabBar) {
        tabBar.currentTitle = widget.title;
      }
      return widget;
    }
    widget = this.leftPanelHandler.expand(id);
    if (widget) {
      return widget;
    }

    return undefined;
  }

  /**
   * Expand the named side panel area. This makes sure that the panel is visible, even if there
   * are no widgets in it. If the panel is already visible, nothing happens. If the panel is currently
   * collapsed (see `collapsePanel`) and it contains widgets, the widgets are revealed that were
   * visible before it was collapsed.
   */
  expandPanel(area: ApplicationShell1.Area): void {
    switch (area) {
      case 'left':
        this.leftPanelHandler.expand();
        break;
      default:
        throw new Error(`Area cannot be expanded: ${area}`);
    }
  }

  /**
   * Adjusts the size of the given area in the application shell.
   *
   * @param size the desired size of the panel in pixels.
   * @param area the area to resize.
   */
  resize(size: number, area: ApplicationShell1.Area): void {
    switch (area) {
      case 'left':
        this.leftPanelHandler.resize(size);
        break;
      default:
        throw new Error(`Area cannot be resized: ${area}`);
    }
  }

  /**
   * Collapse the named side panel area. This makes sure that the panel is hidden,
   * increasing the space that is available for other shell areas.
   */
  collapsePanel(area: ApplicationShell1.Area): void {
    switch (area) {
      case 'left':
        this.leftPanelHandler.collapse();
        break;
      default:
        throw new Error(`Area cannot be collapsed: ${area}`);
    }
  }

  /**
   * Check whether the named side panel area is expanded (returns `true`) or collapsed (returns `false`).
   */
  isExpanded(area: ApplicationShell1.Area): boolean {
    switch (area) {
      case 'left':
        return this.leftPanelHandler.state.expansion === SidePanel.ExpansionState.expanded;

      default:
        return true;
    }
  }

  /**
   * Determine the name of the shell area where the given widget resides. The result is
   * undefined if the widget does not reside directly in the shell.
   */
  getAreaFor(widget: Widget): ApplicationShell1.Area | undefined {
    const title = widget.title;
    const mainPanelTabBar = find(this.mainPanel.tabBars(), bar => ArrayExt.firstIndexOf(bar.titles, title) > -1);
    if (mainPanelTabBar) {
      return 'main';
    }

    if (ArrayExt.firstIndexOf(this.leftPanelHandler.tabBar.titles, title) > -1) {
      return 'left';
    }

    return undefined;
  }

  protected override onBeforeAttach(_msg: Message): void {
    document.addEventListener('lm-dragenter', this, true);
    document.addEventListener('lm-dragover', this, true);
    document.addEventListener('lm-dragleave', this, true);
    document.addEventListener('lm-drop', this, true);
  }

  protected override onAfterDetach(_msg: Message): void {
    document.removeEventListener('lm-dragenter', this, true);
    document.removeEventListener('lm-dragover', this, true);
    document.removeEventListener('lm-dragleave', this, true);
    document.removeEventListener('lm-drop', this, true);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'lm-dragenter':
        this.handleDragEnter(event as IDragEvent);
        break;
      case 'lm-dragover':
        this.handleDragOver(event as IDragEvent);
        break;
      case 'lm-drop':
        this.handleDrop();
        break;
      case 'lm-dragleave':
        this.handleDragLeave();
        break;
    }
  }

  protected handleDragEnter({ mimeData }: IDragEvent) {
    if (!this.dragState) {
      if (mimeData && mimeData.hasData('application/vnd.phosphor.widget-factory')) {
        // The drag contains a widget, so we'll track it and expand side panels as needed
        this.dragState = {
          startTime: performance.now(),
          leftExpanded: false,
        };
      }
    }
  }

  protected handleDragOver(event: IDragEvent) {
    const state = this.dragState;
    if (state) {
      state.lastDragOver = event;
      if (state.leaveTimeout) {
        window.clearTimeout(state.leaveTimeout);
        state.leaveTimeout = undefined;
      }
      const { clientX } = event;
      const { offsetLeft } = this.node;

      // Don't expand any side panels right after the drag has started
      const allowExpansion = performance.now() - state.startTime >= 500;
      const expLeft = allowExpansion && clientX >= offsetLeft
        && clientX <= offsetLeft + this.options.leftPanel.expandThreshold;

      if (expLeft && !state.leftExpanded && this.leftPanelHandler.tabBar.currentTitle === null) {
        // The mouse cursor is moved close to the left border
        this.leftPanelHandler.expand();
        this.leftPanelHandler.state.pendingUpdate.then(() => this.dispatchMouseMove());
        state.leftExpanded = true;
      }
      else if (!expLeft && state.leftExpanded) {
        // The mouse cursor is moved away from the left border
        this.leftPanelHandler.collapse();
        state.leftExpanded = false;
      }
    }
  }

  protected handleDrop() {
    const state = this.dragState;
    if (state) {
      if (state.leaveTimeout) {
        window.clearTimeout(state.leaveTimeout);
      }
      this.dragState = undefined;
      window.requestAnimationFrame(() => {
        // Clean up the side panel state in the next frame
        if (this.leftPanelHandler.dockPanel.isEmpty) {
          this.leftPanelHandler.collapse();
        }
      });
    }
  }

  protected handleDragLeave() {
    const state = this.dragState;
    if (state) {
      state.lastDragOver = undefined;
      if (state.leaveTimeout) {
        window.clearTimeout(state.leaveTimeout);
      }
      state.leaveTimeout = window.setTimeout(() => {
        this.dragState = undefined;
        if (state.leftExpanded || this.leftPanelHandler.dockPanel.isEmpty) {
          this.leftPanelHandler.collapse();
        }
      }, 100);
    }
  }

  /**
   * This method is called after a side panel has been expanded while dragging a widget. It fires
   * a `mousemove` event so that the drag overlay markers are updated correctly in all dock panels.
   */
  private dispatchMouseMove(): void {
    if (this.dragState && this.dragState.lastDragOver) {
      const { clientX, clientY } = this.dragState.lastDragOver;
      const event = document.createEvent('MouseEvent');
      event.initMouseEvent('mousemove', true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
      document.dispatchEvent(event);
    }
  }
}

export const IApplicationShell = createServiceDecorator<IApplicationShell>(ApplicationShell.name);
export type IApplicationShell = ApplicationShell;
