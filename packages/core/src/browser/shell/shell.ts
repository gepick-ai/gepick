import { Deferred, Emitter, IServiceContainer, InjectableService, PostConstruct, URI, createServiceDecorator } from "@gepick/core/common";
import { Signal } from "@lumino/signaling";
import { ArrayExt, find, toArray } from "@lumino/algorithm";
import { IDragEvent } from "@lumino/dragdrop";
import { BaseWidget, BoxLayout, BoxPanel, DockLayout, DockPanel, FocusTracker, Layout, Message, SplitLayout, SplitPanel, TabBar, Widget, waitForClosed } from "../widget";
import { IOpenerService } from "../opener";
import { IContextKeyService } from "../menu";
import { ISidePanelHandlerFactory, MAIN_AREA_ID, SidePanel, SidePanelHandler, TheiaDockPanel } from "./side-panel-handler";
import { ITabBarRendererFactory, ScrollableTabBar } from "./tab-bars";

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
/** Status bar entry identifier for the bottom panel toggle button. */
// const BOTTOM_PANEL_TOGGLE_ID = 'bottom-panel-toggle';
/** The class name added to the main area panel. */
const MAIN_AREA_CLASS = 'theia-app-main';
/** The class name added to the bottom area panel. */
// const BOTTOM_AREA_CLASS = 'theia-app-bottom';

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

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

/**
 * The namespace for `ApplicationShell` class statics.
 */

export class Shell extends BaseWidget {
  /**
   * Handler for the left side panel. The primary application views go here, such as the
   * file explorer and the git view.
   */
  leftPanelHandler: SidePanelHandler;
  leftPanel: BoxPanel;
  mainPanel: DockPanel;
  options: Shell.Options = {
    bottomPanel: {
      ...Shell.DEFAULT_OPTIONS.bottomPanel,
    },
    leftPanel: {
      ...Shell.DEFAULT_OPTIONS.leftPanel,
    },
    rightPanel: {
      ...Shell.DEFAULT_OPTIONS.rightPanel,
    },
  };

  private dragState?: WidgetDragState;
  private readonly tracker = new FocusTracker<Widget>();
  additionalDraggedUris: URI[] | undefined;
  /**
   * A signal emitted whenever the `currentWidget` property is changed.
   */
  readonly currentChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);

  /**
   * A signal emitted whenever the `activeWidget` property is changed.
   */
  readonly activeChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(this);

  protected initializedDeferred = new Deferred<void>();

  protected readonly onDidAddWidgetEmitter = new Emitter<Widget>();
  readonly onDidAddWidget = this.onDidAddWidgetEmitter.event;
  protected fireDidAddWidget(widget: Widget): void {
    this.onDidAddWidgetEmitter.fire(widget);
  }

  protected readonly onDidRemoveWidgetEmitter = new Emitter<Widget>();
  readonly onDidRemoveWidget = this.onDidRemoveWidgetEmitter.event;
  protected fireDidRemoveWidget(widget: Widget): void {
    this.onDidRemoveWidgetEmitter.fire(widget);
  }

  protected readonly onDidChangeActiveWidgetEmitter = new Emitter<FocusTracker.IChangedArgs<Widget>>();
  readonly onDidChangeActiveWidget = this.onDidChangeActiveWidgetEmitter.event;

  protected readonly onDidChangeCurrentWidgetEmitter = new Emitter<FocusTracker.IChangedArgs<Widget>>();
  readonly onDidChangeCurrentWidget = this.onDidChangeCurrentWidgetEmitter.event;

  protected readonly onDidDoubleClickMainAreaEmitter = new Emitter<void>();
  readonly onDidDoubleClickMainArea = this.onDidDoubleClickMainAreaEmitter.event;

  protected static getDraggedEditorUris(dataTransfer: DataTransfer): URI[] {
    const data = dataTransfer.getData('theia-editor-dnd');
    return data ? data.split('\n').map(entry => new URI(entry)) : [];
  }

  static setDraggedEditorUris(dataTransfer: DataTransfer, uris: URI[]): void {
    dataTransfer.setData('theia-editor-dnd', uris.map(uri => uri.toString()).join('\n'));
  }

  private _mainPanelRenderer: DockPanelRenderer;
  get mainPanelRenderer(): DockPanelRenderer {
    return this._mainPanelRenderer;
  }

  constructor(
    @ISidePanelHandlerFactory protected readonly sidePanelHandlerFactory: ISidePanelHandlerFactory,
    @IDockPanelRendererFactory protected readonly dockPanelRendererFactory: IDockPanelRendererFactory,
    @IOpenerService protected openerService: IOpenerService,
    @IContextKeyService protected readonly contextKeyService: IContextKeyService,
  ) {
    super();
  }

  get ready() {
    return this.initializedDeferred.promise;
  }

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
  get currentTabArea(): Shell.Area | undefined {
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

  /**
   * A promise that is resolved when all currently pending updates are done.
   */
  get pendingUpdates(): Promise<void> {
    return Promise.all([
      this.leftPanelHandler.state.pendingUpdate,
    ]) as Promise<any>;
  }

  @PostConstruct()
  protected init(): void {
    this.id = 'theia-app-shell';
    this.addClass(APPLICATION_SHELL_CLASS);
    this.layout = this.createLayout();

    this.tracker.currentChanged.connect(this.handleCurrentChanged, this);
    this.tracker.activeChanged.connect(this.handleActiveChanged, this);

    this.initializedDeferred.resolve();
  }

  protected initSidebarVisibleKeyContext(): void {
    const leftSideBarPanel = this.leftPanelHandler.dockPanel;
    const sidebarVisibleKey = this.contextKeyService.createKey('sidebarVisible', leftSideBarPanel.isVisible);
    // @ts-ignore
    const onAfterShow = leftSideBarPanel.onAfterShow.bind(leftSideBarPanel);
    // @ts-ignore
    leftSideBarPanel.onAfterShow = (msg: Message) => {
      onAfterShow(msg);
      sidebarVisibleKey.set(true);
    };
    // @ts-ignore
    const onAfterHide = leftSideBarPanel.onAfterHide.bind(leftSideBarPanel);
    // @ts-ignore
    leftSideBarPanel.onAfterHide = (msg: Message) => {
      onAfterHide(msg);
      sidebarVisibleKey.set(false);
    };
  }

  protected createLayout(): Layout {
    // Left Panel
    this.leftPanel = this.createSidePanel();

    // Main Panel
    this.mainPanel = this.createMainPanel();

    // 创建一个左中右分割布局面板
    const leftRightLayoutPanel = new SplitPanel({ layout: this.createSplitLayout([this.leftPanel, this.mainPanel], [0, 1], { orientation: 'horizontal', spacing: 0 }) });
    leftRightLayoutPanel.id = 'theia-left-right-split-panel';

    // 创建一个从上到下的单列布局
    return this.createBoxLayout([leftRightLayoutPanel]);
  }

  protected createSidePanel(): BoxPanel {
    const sidebarHandler = this.sidePanelHandlerFactory.createSidePanelHandler();
    sidebarHandler.createSidePanel(this.options.leftPanel);
    this.leftPanelHandler = sidebarHandler;
    return sidebarHandler.container;
  }

  /**
   * Create the dock panel in the main shell area.
   */
  protected createMainPanel(): DockPanel {
    const renderer = this.dockPanelRendererFactory.createDockPanelRenderer();
    renderer.tabBarClasses.push(MAIN_BOTTOM_AREA_CLASS);
    renderer.tabBarClasses.push(MAIN_AREA_CLASS);
    this._mainPanelRenderer = renderer;

    renderer.tabBarClasses.push(MAIN_BOTTOM_AREA_CLASS);
    const dockPanel = new TheiaDockPanel({
      mode: 'multiple-document',
      renderer,
      spacing: 0,
    });

    dockPanel.id = MAIN_AREA_ID;
    dockPanel.widgetAdded.connect((_, widget) => this.fireDidAddWidget(widget));
    dockPanel.widgetRemoved.connect((_, widget) => this.fireDidRemoveWidget(widget));

    const openUri = async (fileUri: URI) => {
      try {
        const opener = await this.openerService.getOpener(fileUri);
        opener.open(fileUri);
      }
      catch {
        // eslint-disable-next-line no-console
        console.info(`no opener found for '${fileUri}'`);
      }
    };

    dockPanel.node.addEventListener('drop', (event) => {
      if (event.dataTransfer) {
        const uris = this.additionalDraggedUris || Shell.getDraggedEditorUris(event.dataTransfer);
        if (uris.length > 0) {
          uris.forEach(openUri);
        }
      }
    });

    dockPanel.node.addEventListener('dblclick', (event) => {
      const el = event.target as Element;
      if (el.id === MAIN_AREA_ID || el.classList.contains('lm-TabBar-content')) {
        this.onDidDoubleClickMainAreaEmitter.fire();
      }
    });

    const handler = (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'link';
        e.preventDefault();
        e.stopPropagation();
      }
    };
    dockPanel.node.addEventListener('dragover', handler);
    dockPanel.node.addEventListener('dragenter', handler);

    return dockPanel;
  }

  /**
   * Create a box layout to assemble the application shell layout.
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
  getTabBarFor(widgetOrArea: Widget | Shell.Area): TabBar<Widget> | undefined {
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
  addWidget(widget: Widget, options: Shell.WidgetOptions) {
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
  getWidgets(area: Shell.Area): Widget[] {
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
   * @returns the widget that was closed, if any, `undefined` otherwise.
   *
   * If your use case requires closing multiple widgets, use {@link Shell#closeMany} instead. That method handles closing saveable widgets more reliably.
   */
  async closeWidget(id: string, _options?: Shell.CloseOptions): Promise<Widget | undefined> {
    // TODO handle save for composite widgets, i.e. the preference widget has 2 editors
    const stack = this.toTrackedStack(id);
    const current = stack.pop();
    if (!current) {
      return undefined;
    }
    const pendingClose = (current.close(), waitForClosed(current));
    await Promise.all([
      pendingClose,
      this.pendingUpdates,
    ]);
    return stack[0] || current;
  }

  /**
   * @returns an array of Widgets, all of which are tracked by the focus tracker
   * The first member of the array is the widget whose id is passed in, and the other widgets
   * are its tracked parents in ascending order
   */
  protected toTrackedStack(id: string): Widget[] {
    const tracked = new Map<string, Widget>(this.tracker.widgets.map(w => [w.id, w] as [string, Widget]));
    let current = tracked.get(id);
    const stack: Widget[] = [];
    while (current) {
      if (tracked.has(current.id)) {
        stack.push(current);
      }
      current = current.parent || undefined;
    }
    return stack;
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
  expandPanel(area: Shell.Area): void {
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
  resize(size: number, area: Shell.Area): void {
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
  collapsePanel(area: Shell.Area): void {
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
  isExpanded(area: Shell.Area): boolean {
    switch (area) {
      case 'left':
        return this.leftPanelHandler.state.expansion === SidePanel.ExpansionState.expanded;

      default:
        return true;
    }
  }

  /**
   * @param targets the widgets to be closed
   * @return an array of all the widgets that were actually closed.
   */
  async closeMany(targets: Widget[], options?: Shell.CloseOptions): Promise<Widget[]> {
    if (options?.save === false) {
      return (await Promise.all(targets.map(target => this.closeWidget(target.id, options)))).filter((widget): widget is Widget => widget !== undefined);
    }
    return [];
  }

  /**
   * Determine the name of the shell area where the given widget resides. The result is
   * undefined if the widget does not reside directly in the shell.
   */
  getAreaFor(widget: Widget): Shell.Area | undefined {
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

  getInsertionOptions(options?: Readonly<Shell.WidgetOptions>): { area: string; addOptions: TheiaDockPanel.AddOptions } {
    let ref: Widget | undefined = options?.ref as any;
    let area: Shell.Area = options?.area || 'main';
    if (!ref && (area === 'main')) {
      const tabBar = this.getTabBarFor(area);
      ref = tabBar && tabBar.currentTitle && tabBar.currentTitle.owner || undefined;
    }
    // make sure that ref belongs to area
    area = ref && this.getAreaFor(ref) || area;
    const addOptions: TheiaDockPanel.AddOptions = {};
    if (Shell.isOpenToSideMode(options?.mode)) {
      const areaPanel = area === 'main' ? (this.mainPanel as TheiaDockPanel) : undefined;
      const sideRef = areaPanel && ref && (options?.mode === 'open-to-left'
        ? areaPanel.previousTabBarWidget(ref)
        : areaPanel.nextTabBarWidget(ref));
      if (sideRef) {
        addOptions.ref = sideRef;
      }
      else {
        addOptions.ref = ref;
        addOptions.mode = options?.mode === 'open-to-left' ? 'split-left' : 'split-right';
      }
    }
    else if (Shell.isReplaceMode(options?.mode)) {
      addOptions.ref = options?.ref;
      addOptions.closeRef = true;
      addOptions.mode = 'tab-after';
    }
    else {
      addOptions.ref = ref;
      addOptions.mode = options?.mode;
    }
    return { area, addOptions };
  }
}

export namespace Shell {
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

  export interface CloseOptions {
    /**
     * if optional then a user will be prompted
     * if undefined then close will be canceled
     * if true then will be saved on close
     * if false then won't be saved on close
     */
    save?: boolean | undefined;
  }

  /**
   * Whether a widget should be opened to the side tab bar relatively to the reference widget.
   */
  export type OpenToSideMode = 'open-to-left' | 'open-to-right';

  export function isOpenToSideMode(mode: unknown): mode is OpenToSideMode {
    return mode === 'open-to-left' || mode === 'open-to-right';
  }

  /**
   * Whether the `ref` of the options widget should be replaced.
   */
  export type ReplaceMode = 'tab-replace';

  export function isReplaceMode(mode: unknown): mode is ReplaceMode {
    return mode === 'tab-replace';
  }
}

export const IShell = createServiceDecorator<IShell>(Shell.name);
export type IShell = Shell;
