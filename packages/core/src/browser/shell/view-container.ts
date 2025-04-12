import { DisposableStore, Emitter, Event, IDisposable, InjectableService, Key, PostConstruct, createServiceDecorator, isObject, toDisposable } from "@gepick/core/common";
import { DockPanel, LayoutItem, PanelLayout, SplitLayout, SplitPanel, Widget } from "@lumino/widgets";
import { map, some } from '@lumino/algorithm';
import { interfaces } from "inversify";
import { isEmpty } from "lodash-es";
import { MimeData } from "@lumino/coreutils";
import { Drag } from "@lumino/dragdrop";
import { BaseWidget, CODICON_TREE_ITEM_CLASSES, COLLAPSED_CLASS, EXPANSION_TOGGLE_CLASS, IWidgetManager, Message, MessageLoop, PINNED_CLASS, UnsafeWidgetUtilities, addEventListener, addKeyListener, waitForRevealed } from "../widgets";
import { ISplitPositionHandler, MAIN_AREA_ID, SplitPositionHandler, SplitPositionOptions } from "./side-panel";
import { IApplicationShell } from "./shell";
import { ITabBarToolbarRegistry, TabBarToolbar, TabBarToolbarFactory, TabBarToolbarRegistry } from "./tab-bar-toolbar";

/**
 * Parse a magnitude value (e.g. width, height, left, top) from a CSS attribute value.
 * Returns the given default value (or undefined) if the value cannot be determined,
 * e.g. because it is a relative value like `50%` or `auto`.
 */
export function parseCssMagnitude(value: string | null, defaultValue: number): number;
export function parseCssMagnitude(value: string | null, defaultValue?: number): number | undefined {
  if (value) {
    let parsed: number;
    if (value.endsWith('px')) {
      parsed = Number.parseFloat(value.substring(0, value.length - 2));
    }
    else {
      parsed = Number.parseFloat(value);
    }
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
}

export interface ViewContainerTitleOptions {
  label: string;
  caption?: string;
  iconClass?: string;
  closeable?: boolean;
}

export class ViewContainerIdentifier extends InjectableService {
  id: string;
  progressLocationId?: string;
}
export const IViewContainerIdentifier = createServiceDecorator<IViewContainerIdentifier>(ViewContainerIdentifier.name);
export type IViewContainerIdentifier = ViewContainerIdentifier;

// ====BadgeWidget start====

export interface BadgeWidget {
  badge?: number;
  badgeTooltip?: string;
  onDidChangeBadge: Event<void>;
  onDidChangeBadgeTooltip: Event<void>;
}

export namespace BadgeWidget {
  export function is(arg: unknown): arg is BadgeWidget {
    return isObject(arg) && 'onDidChangeBadge' in arg && 'onDidChangeBadgeTooltip' in arg;
  }
}

// ====BadgeWidget end====

// ====DescriptionWidget start====
export interface DescriptionWidget {
  description: string;
  onDidChangeDescription: Event<void>;
}

export namespace DescriptionWidget {
  export function is(arg: unknown): arg is DescriptionWidget {
    return isObject(arg) && 'onDidChangeDescription' in arg;
  }
}
// ====DescriptionWidget end====

// ====DynamicToolbarWidget start====
/**
 * A widget that may change it's internal structure dynamically.
 * Current use is to update the toolbar when a contributed view is constructed "lazily".
 */
export interface DynamicToolbarWidget {
  onDidChangeToolbarItems: Event<void>;
}

export namespace DynamicToolbarWidget {
  export function is(arg: unknown): arg is DynamicToolbarWidget {
    return isObject(arg) && 'onDidChangeToolbarItems' in arg;
  }
}
// ====DynamicToolbarWidget end====

// ====ViewContainerPart start====
export namespace ViewContainerPart1 {

  /**
   * Make sure to adjust the `line-height` of the `.theia-view-container .part > .header` CSS class when modifying this, and vice versa.
   */
  export const HEADER_HEIGHT = 22;

  export interface State {
    widget?: Widget;
    partId: string;
    collapsed: boolean;
    hidden: boolean;
    relativeSize?: number;
    description?: string;
    /** The original container to which this part belongs */
    originalContainerId: string;
    originalContainerTitle?: ViewContainerTitleOptions;
  }

  export function closestPart(element: Element | EventTarget | null, selector: string = 'div.part'): Element | undefined {
    if (element instanceof Element) {
      const part = element.closest(selector);
      if (part instanceof Element) {
        return part;
      }
    }
    return undefined;
  }
}

/**
 * Wrapper around a widget held by a view container. Adds a header to display the
 * title, toolbar, and collapse / expand handle.
 */
export class ViewContainerPart extends BaseWidget {
  protected readonly header: HTMLElement;
  protected readonly body: HTMLElement;
  protected readonly collapsedEmitter = new Emitter<boolean>();
  protected readonly contextMenuEmitter = new Emitter<MouseEvent>();

  protected readonly onTitleChangedEmitter = new Emitter<void>();
  readonly onTitleChanged = this.onTitleChangedEmitter.event;
  protected readonly onDidFocusEmitter = new Emitter<this>();
  readonly onDidFocus = this.onDidFocusEmitter.event;
  protected readonly onPartMovedEmitter = new Emitter<ViewContainer>();
  readonly onDidMove = this.onPartMovedEmitter.event;
  protected readonly onDidChangeDescriptionEmitter = new Emitter<void>();
  readonly onDidChangeDescription = this.onDidChangeDescriptionEmitter.event;
  protected readonly onDidChangeBadgeEmitter = new Emitter<void>();
  readonly onDidChangeBadge = this.onDidChangeBadgeEmitter.event;
  protected readonly onDidChangeBadgeTooltipEmitter = new Emitter<void>();
  readonly onDidChangeBadgeTooltip = this.onDidChangeBadgeTooltipEmitter.event;

  protected readonly toolbar: TabBarToolbar;

  protected _collapsed: boolean;

  uncollapsedSize: number | undefined;
  animatedSize: number | undefined;

  protected readonly toNoDisposeWrapped: IDisposable;

  constructor(
    readonly wrapped: Widget,
    readonly partId: string,
    protected currentContainerId: string,
    readonly originalContainerId: string,
    readonly originalContainerTitle: ViewContainerTitleOptions | undefined,
    protected readonly toolbarRegistry: TabBarToolbarRegistry,
    protected readonly toolbarFactory: TabBarToolbarFactory,
    readonly options: ViewContainer1.Factory.WidgetOptions = {},
  ) {
    super();
    wrapped.parent = this;
    wrapped.disposed.connect(() => this.dispose());
    this.id = `${originalContainerId}--${wrapped.id}`;
    this.addClass('part');

    const fireTitleChanged = () => this.onTitleChangedEmitter.fire(undefined);
    this.wrapped.title.changed.connect(fireTitleChanged);
    this.toDispose.add(toDisposable(() => this.wrapped.title.changed.disconnect(fireTitleChanged)));

    if (DescriptionWidget.is(this.wrapped)) {
      this.wrapped?.onDidChangeDescription(() => this.onDidChangeDescriptionEmitter.fire(), undefined, this.toDispose);
    }

    if (BadgeWidget.is(this.wrapped)) {
      this.wrapped.onDidChangeBadge(() => this.onDidChangeBadgeEmitter.fire(), undefined, this.toDispose);
      this.wrapped.onDidChangeBadgeTooltip(() => this.onDidChangeBadgeTooltipEmitter.fire(), undefined, this.toDispose);
    }

    if (DynamicToolbarWidget.is(this.wrapped)) {
      this.wrapped.onDidChangeToolbarItems(() => {
        this.toolbar.updateTarget(this.wrapped);
        this.viewContainer?.update();
      });
    }

    const { header, body, disposable } = this.createContent();
    this.header = header;
    this.body = body;

    this.toNoDisposeWrapped = this.toDispose.add(wrapped);
    this.toolbar = this.toolbarFactory();
    this.toolbar.addClass('theia-view-container-part-title');

    [
      disposable,
      this.toolbar,
      this.toolbarRegistry.onDidChange(() => this.toolbar.updateTarget(this.wrapped)),
      this.collapsedEmitter,
      this.contextMenuEmitter,
      this.onTitleChangedEmitter,
      this.onDidChangeDescriptionEmitter,
      this.onDidChangeBadgeEmitter,
      this.onDidChangeBadgeTooltipEmitter,
      this.registerContextMenu(),
      this.onDidFocusEmitter,
      // focus event does not bubble, capture it
      addEventListener(this.node, 'focus', () => this.onDidFocusEmitter.fire(this), true),
    ].forEach(d => this.toDispose.add(d));

    this.scrollOptions = {
      suppressScrollX: true,
      minScrollbarLength: 35,
    };
    this.collapsed = !!options.initiallyCollapsed;
    if (options.initiallyHidden && this.canHide) {
      this.hide();
    }
  }

  get viewContainer(): ViewContainer | undefined {
    return this.parent ? this.parent.parent as ViewContainer : undefined;
  }

  get currentViewContainerId(): string {
    return this.currentContainerId;
  }

  get headerElement(): HTMLElement {
    return this.header;
  }

  get collapsed(): boolean {
    return this._collapsed;
  }

  set collapsed(collapsed: boolean) {
    // Cannot collapse/expand if the orientation of the container is `horizontal`.
    // eslint-disable-next-line ts/no-use-before-define
    const orientation = ViewContainer1.getOrientation(this.node);
    if (this._collapsed === collapsed || (orientation === 'horizontal' && collapsed)) {
      return;
    }
    this._collapsed = collapsed;
    this.node.classList.toggle('collapsed', collapsed);

    if (collapsed && this.wrapped.node.contains(document.activeElement)) {
      this.header.focus();
    }
    this.wrapped.setHidden(collapsed);
    const toggleIcon = this.header.querySelector(`span.${EXPANSION_TOGGLE_CLASS}`);
    if (toggleIcon) {
      if (collapsed) {
        toggleIcon.classList.add(COLLAPSED_CLASS);
      }
      else {
        toggleIcon.classList.remove(COLLAPSED_CLASS);
      }
    }
    this.update();
    this.collapsedEmitter.fire(collapsed);
  }

  onPartMoved(newContainer: ViewContainer): void {
    this.currentContainerId = newContainer.id;
    this.onPartMovedEmitter.fire(newContainer);
  }

  override setHidden(hidden: boolean): void {
    if (!this.canHide) {
      return;
    }
    super.setHidden(hidden);
  }

  get canHide(): boolean {
    return this.options.canHide === undefined || this.options.canHide;
  }

  get onCollapsed(): Event<boolean> {
    return this.collapsedEmitter.event;
  }

  get onContextMenu(): Event<MouseEvent> {
    return this.contextMenuEmitter.event;
  }

  get minSize(): number {
    const style = getComputedStyle(this.body);
    // eslint-disable-next-line ts/no-use-before-define
    if (ViewContainer1.getOrientation(this.node) === 'horizontal') {
      return parseCssMagnitude(style.minWidth, 0);
    }
    else {
      return parseCssMagnitude(style.minHeight, 0);
    }
  }

  protected readonly toShowHeader = new DisposableStore();
  showTitle(): void {
    this.toShowHeader.dispose();
  }

  hideTitle(): void {
    if (this.titleHidden) {
      return;
    }
    const display = this.header.style.display;
    const height = this.body.style.height;
    this.body.style.height = '100%';
    this.header.style.display = 'none';
    this.toShowHeader.add(toDisposable(() => {
      this.header.style.display = display;
      this.body.style.height = height;
    }));
  }

  get titleHidden(): boolean {
    return !this.toShowHeader.isDisposed || this.collapsed;
  }

  protected override getScrollContainer(): HTMLElement {
    return this.body;
  }

  protected registerContextMenu(): IDisposable {
    const disposableStore = new DisposableStore();

    disposableStore.add(addEventListener(this.header, 'contextmenu', (event) => {
      this.contextMenuEmitter.fire(event);
    }));

    return disposableStore;
  }

  protected createContent(): { header: HTMLElement; body: HTMLElement; disposable: IDisposable } {
    const disposable = new DisposableStore();
    const { header, disposable: headerDisposable } = this.createHeader();
    const body = document.createElement('div');
    body.classList.add('body');
    this.node.appendChild(header);
    this.node.appendChild(body);
    disposable.add(headerDisposable);
    return {
      header,
      body,
      disposable,
    };
  }

  protected createHeader(): { header: HTMLElement; disposable: IDisposable } {
    const disposable = new DisposableStore();
    const header = document.createElement('div');
    header.tabIndex = 0;
    header.classList.add('theia-header', 'header', 'theia-view-container-part-header');
    disposable.add(addEventListener(header, 'click', (event) => {
      if (this.toolbar && this.toolbar.shouldHandleMouseEvent(event)) {
        return;
      }
      this.collapsed = !this.collapsed;
    }));
    disposable.add(addKeyListener(header, Key.ARROW_LEFT, () => this.collapsed = true));
    disposable.add(addKeyListener(header, Key.ARROW_RIGHT, () => this.collapsed = false));
    disposable.add(addKeyListener(header, Key.ENTER, () => this.collapsed = !this.collapsed));

    const toggleIcon = document.createElement('span');
    toggleIcon.classList.add(EXPANSION_TOGGLE_CLASS, ...CODICON_TREE_ITEM_CLASSES);
    if (this.collapsed) {
      toggleIcon.classList.add(COLLAPSED_CLASS);
    }
    header.appendChild(toggleIcon);

    const title = document.createElement('span');
    title.classList.add('label', 'noselect');

    const description = document.createElement('span');
    description.classList.add('description');

    const badgeSpan = document.createElement('span');
    badgeSpan.classList.add('notification-count');

    const badgeContainer = document.createElement('div');
    badgeContainer.classList.add('notification-count-container');
    badgeContainer.appendChild(badgeSpan);
    const badgeContainerDisplay = badgeContainer.style.display;

    const updateTitle = () => {
      if (this.currentContainerId !== this.originalContainerId && this.originalContainerTitle?.label) {
        // Creating a title in format: <original_container_title>: <part_title>.
        title.textContent = `${this.originalContainerTitle.label}: ${this.wrapped.title.label}`;
      }
      else {
        title.textContent = this.wrapped.title.label;
      }
    };
    const updateCaption = () => title.title = this.wrapped.title.caption || this.wrapped.title.label;
    const updateDescription = () => {
      description.textContent = DescriptionWidget.is(this.wrapped) && !this.collapsed && this.wrapped.description || '';
    };
    const updateBadge = () => {
      if (BadgeWidget.is(this.wrapped)) {
        const visibleToolBarItems = this.toolbarRegistry.visibleItems(this.wrapped).length > 0;
        const badge = this.wrapped.badge;
        if (badge && !visibleToolBarItems) {
          badgeSpan.textContent = badge.toString();
          badgeSpan.title = this.wrapped.badgeTooltip || '';
          badgeContainer.style.display = badgeContainerDisplay;
          return;
        }
      }
      badgeContainer.style.display = 'none';
    };

    updateTitle();
    updateCaption();
    updateDescription();
    updateBadge();

    [
      this.onTitleChanged(updateTitle),
      this.onTitleChanged(updateCaption),
      this.onDidMove(updateTitle),
      this.onDidChangeDescription(updateDescription),
      this.onDidChangeBadge(updateBadge),
      this.onDidChangeBadgeTooltip(updateBadge),
      this.onCollapsed(updateDescription),
    ].forEach(d => disposable.add(d))

    ;
    header.appendChild(title);
    header.appendChild(description);
    header.appendChild(badgeContainer);

    return {
      header,
      disposable,
    };
  }

  protected handleResize(): void {
    const handleMouseEnter = () => {
      this.node?.classList.add('no-pointer-events');
      setTimeout(() => {
        this.node?.classList.remove('no-pointer-events');
        this.node?.removeEventListener('mouseenter', handleMouseEnter);
      }, 100);
    };
    this.node?.addEventListener('mouseenter', handleMouseEnter);
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    this.handleResize();
    if (this.wrapped.isAttached && !this.collapsed) {
      MessageLoop.sendMessage(this.wrapped, Widget.ResizeMessage.UnknownSize);
    }
    super.onResize(msg);
  }

  protected override onUpdateRequest(msg: Message): void {
    if (this.wrapped.isAttached && !this.collapsed) {
      MessageLoop.sendMessage(this.wrapped, msg);
    }
    super.onUpdateRequest(msg);
  }

  protected override onAfterAttach(msg: Message): void {
    if (!this.wrapped.isAttached) {
      UnsafeWidgetUtilities.attach(this.wrapped, this.body);
    }
    UnsafeWidgetUtilities.attach(this.toolbar, this.header);
    super.onAfterAttach(msg);
  }

  protected override onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    if (this.toolbar.isAttached) {
      Widget.detach(this.toolbar);
    }
    if (this.wrapped.isAttached) {
      UnsafeWidgetUtilities.detach(this.wrapped);
    }
  }

  protected override onBeforeShow(msg: Message): void {
    if (this.wrapped.isAttached && !this.collapsed) {
      MessageLoop.sendMessage(this.wrapped, msg);
    }
    super.onBeforeShow(msg);
  }

  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    if (this.wrapped.isAttached && !this.collapsed) {
      MessageLoop.sendMessage(this.wrapped, msg);
    }
  }

  protected override onBeforeHide(msg: Message): void {
    if (this.wrapped.isAttached && !this.collapsed) {
      MessageLoop.sendMessage(this.wrapped, msg);
    }
    super.onBeforeShow(msg);
  }

  protected override onAfterHide(msg: Message): void {
    super.onAfterHide(msg);
    if (this.wrapped.isAttached && !this.collapsed) {
      MessageLoop.sendMessage(this.wrapped, msg);
    }
  }

  protected override onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    // if wrapped is not disposed, but detached then we should not dispose it, but only get rid of this part
    this.toNoDisposeWrapped.dispose();
    this.dispose();
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    if (this.collapsed) {
      this.header.focus();
    }
    else {
      this.wrapped.activate();
    }
  }
}

// ====ViewContainerPart end====

// ====ViewContainer start====
export namespace ViewContainer1 {

  export const Factory = Symbol('ViewContainerFactory');
  export interface Factory {
    (options: ViewContainerIdentifier): ViewContainer;
  }

  export namespace Factory {

    export interface WidgetOptions {
      readonly order?: number;
      readonly weight?: number;
      readonly initiallyCollapsed?: boolean;
      readonly canHide?: boolean;
      readonly initiallyHidden?: boolean;
      /**
       * Disable dragging this part from its original container to other containers,
       * But allow dropping parts from other containers on it,
       * This option only applies to the `ViewContainerPart` and has no effect on the ViewContainer.
       */
      readonly disableDraggingToOtherContainers?: boolean;
    }

    export interface WidgetDescriptor {
      readonly widget: Widget | interfaces.ServiceIdentifier<Widget>;
      readonly options?: WidgetOptions;
    }

  }

  export interface State {
    title?: ViewContainerTitleOptions;
    parts: ViewContainerPart1.State[];
  }

  export function getOrientation(node: HTMLElement): 'horizontal' | 'vertical' {
    if (node.closest(`#${MAIN_AREA_ID}`)) {
      return 'horizontal';
    }
    return 'vertical';
  }
}
export class ViewContainer extends BaseWidget {
  protected panel: SplitPanel;

  protected currentPart: ViewContainerPart | undefined;

  protected titleOptions: ViewContainerTitleOptions | undefined;

  protected lastVisibleState: ViewContainer1.State | undefined;

  protected _tabBarDelegate: Widget = this;

  /**
   * Disable dragging parts from/to this view container.
   */
  disableDNDBetweenContainers = false;

  protected readonly onDidChangeTrackableWidgetsEmitter = new Emitter<Widget[]>();
  readonly onDidChangeTrackableWidgets = this.onDidChangeTrackableWidgetsEmitter.event;

  protected readonly toDisposeOnUpdateTitle = new DisposableStore();
  protected readonly toRemoveWidgets = new Map<string, DisposableStore>();

  constructor(
    @IViewContainerIdentifier readonly options: IViewContainerIdentifier,
    @ISplitPositionHandler readonly splitPositionHandler: ISplitPositionHandler,
    @IWidgetManager readonly widgetManager: IWidgetManager,
    @IApplicationShell readonly shell: IApplicationShell,
    @ITabBarToolbarRegistry readonly toolbarRegistry: ITabBarToolbarRegistry,
    readonly toolbarFactory: any,
  ) {
    super();
  }

  protected get orientation(): SplitLayout.Orientation {
    return ViewContainer1.getOrientation(this.node);
  }

  get containerLayout(): ViewContainerLayout {
    const layout = this.panel.layout;
    if (layout instanceof ViewContainerLayout) {
      return layout;
    }
    throw new Error('view container is disposed');
  }

  protected get enableAnimation(): boolean {
    return true;
  }

  @PostConstruct()
  protected init() {
    this.id = this.options.id;
    this.addClass('theia-view-container');
    const layout = new PanelLayout();
    this.layout = layout;
    this.panel = new SplitPanel({
      layout: new ViewContainerLayout({
        renderer: SplitPanel.defaultRenderer,
        orientation: this.orientation,
        spacing: 2,
        headerSize: ViewContainerPart1.HEADER_HEIGHT,
        animationDuration: 200,
      }, this.splitPositionHandler),
    });
    this.panel.node.tabIndex = -1;

    this.configureLayout(layout);
  }

  protected configureLayout(layout: PanelLayout): void {
    layout.addWidget(this.panel);
  }

  protected readonly toDisposeOnCurrentPart = new DisposableStore();

  protected updateCurrentPart(part?: ViewContainerPart): void {
    if (part && this.getParts().includes(part)) {
      this.currentPart = part;
    }
    if (this.currentPart && !this.currentPart.isDisposed) {
      return;
    }
    const visibleParts = this.getParts().filter(p => !p.isHidden);
    const expandedParts = visibleParts.filter(p => !p.collapsed);
    this.currentPart = expandedParts[0] || visibleParts[0];
  }

  protected updateSplitterVisibility(): void {
    const className = 'lm-first-visible';
    let firstFound = false;
    for (const part of this.getParts()) {
      if (!part.isHidden && !firstFound) {
        part.addClass(className);
        firstFound = true;
      }
      else {
        part.removeClass(className);
      }
    }
  }

  setTitleOptions(titleOptions: ViewContainerTitleOptions | undefined): void {
    this.titleOptions = titleOptions;
    this.updateTitle();
  }

  protected updateTitle(): void {
    this.toDisposeOnUpdateTitle.dispose();
    this.toDispose.add(this.toDisposeOnUpdateTitle);
    this.updateTabBarDelegate();
    let title = Object.assign({}, this.titleOptions);
    if (isEmpty(title)) {
      return;
    }
    const allParts = this.getParts();
    const visibleParts = allParts.filter(part => !part.isHidden);
    this.title.label = title.label;
    // If there's only one visible part - inline it's title into the container title except in case the part
    // isn't originally belongs to this container but there are other **original** hidden parts.
    if (visibleParts.length === 1 && (visibleParts[0].originalContainerId === this.id || !this.findOriginalPart())) {
      const part = visibleParts[0];
      this.toDisposeOnUpdateTitle.add(part.onTitleChanged(() => this.updateTitle()));
      const partLabel = part.wrapped.title.label;
      // Change the container title if it contains only one part that originally belongs to another container.
      if (allParts.length === 1 && part.originalContainerId !== this.id && !this.isCurrentTitle(part.originalContainerTitle)) {
        title = Object.assign({}, part.originalContainerTitle);
        this.setTitleOptions(title);
        return;
      }
      if (partLabel) {
        if (this.title.label && this.title.label !== partLabel) {
          this.title.label += `: ${partLabel}`;
        }
        else {
          this.title.label = partLabel;
        }
      }
      part.collapsed = false;
      part.hideTitle();
    }
    else {
      visibleParts.forEach(part => part.showTitle());
      // If at least one part originally belongs to this container the title should return to its original value.
      const originalPart = this.findOriginalPart();
      if (originalPart && !this.isCurrentTitle(originalPart.originalContainerTitle)) {
        title = Object.assign({}, originalPart.originalContainerTitle);
        this.setTitleOptions(title);
        return;
      }
    }
    this.updateToolbarItems(allParts);
    this.title.caption = title?.caption || title?.label;
    if (title.iconClass) {
      this.title.iconClass = title.iconClass;
    }
    if (this.title.className.includes(PINNED_CLASS)) {
      this.title.closable &&= false;
    }
    else if (title.closeable !== undefined) {
      this.title.closable = title.closeable;
    }
  }

  getParts(): ViewContainerPart[] {
    return this.containerLayout.widgets;
  }

  protected findOriginalPart(): ViewContainerPart | undefined {
    return this.getParts().find(part => part.originalContainerId === this.id);
  }

  protected isCurrentTitle(titleOptions: ViewContainerTitleOptions | undefined): boolean {
    return (!!titleOptions && !!this.titleOptions && Object.keys(titleOptions).every(key => (titleOptions as any)[key] === (this.titleOptions as any)[key]))
      || (!titleOptions && !this.titleOptions);
  }

  updateTabBarDelegate(): void {
    const visibleParts = this.getParts().filter(part => !part.isHidden);
    if (visibleParts.length === 1) {
      this._tabBarDelegate = visibleParts[0].wrapped;
    }
    else {
      this._tabBarDelegate = this;
    }
  }

  protected updateToolbarItems(allParts: ViewContainerPart[]): void {
    if (allParts.length > 1) {
      const group = this.getToggleVisibilityGroupLabel();
      for (const part of allParts) {
        const existingId = this.toggleVisibilityCommandId(part);
        const { caption, label, dataset: { visibilityCommandLabel } } = part.wrapped.title;
        this.registerToolbarItem(existingId, { tooltip: visibilityCommandLabel || caption || label, group });
      }
    }
  }

  protected getToggleVisibilityGroupLabel(): string {
    return 'view';
  }

  protected toggleVisibilityCommandId(part: ViewContainerPart): string {
    return `${this.id}:toggle-visibility-${part.id}`;
  }

  protected registerToolbarItem(_commandId: string, _options?: any): void {}

  addWidget(widget: Widget, options?: ViewContainer1.Factory.WidgetOptions, originalContainerId?: string, originalContainerTitle?: ViewContainerTitleOptions): IDisposable {
    const existing = this.toRemoveWidgets.get(widget.id);
    if (existing) {
      return existing;
    }
    const partId = this.createPartId(widget);
    const newPart = this.createPart(widget, partId, originalContainerId || this.id, originalContainerTitle || this.titleOptions, options);
    return this.attachNewPart(newPart);
  }

  protected createPartId(widget: Widget): string {
    const description = this.widgetManager.getDescription(widget);
    return widget.id || JSON.stringify(description);
  }

  protected createPart(widget: Widget, partId: string, originalContainerId: string, originalContainerTitle?: ViewContainerTitleOptions, options?: ViewContainer1.Factory.WidgetOptions): ViewContainerPart {
    return new ViewContainerPart(widget, partId, this.id, originalContainerId, originalContainerTitle, this.toolbarRegistry, this.toolbarFactory, options);
  }

  protected attachNewPart(newPart: ViewContainerPart, insertIndex?: number): IDisposable {
    const toRemoveWidget = new DisposableStore();
    this.toDispose.add(toRemoveWidget);
    this.toRemoveWidgets.set(newPart.wrapped.id, toRemoveWidget);
    toRemoveWidget.add(toDisposable(() => this.toRemoveWidgets.delete(newPart.wrapped.id)));
    this.registerPart(newPart);
    if (insertIndex !== undefined || (newPart.options && newPart.options.order !== undefined)) {
      const index = insertIndex ?? this.getParts().findIndex(part => part.options.order === undefined || part.options.order > newPart.options.order!);
      if (index >= 0) {
        this.containerLayout.insertWidget(index, newPart);
      }
      else {
        this.containerLayout.addWidget(newPart);
      }
    }
    else {
      this.containerLayout.addWidget(newPart);
    }
    this.refreshMenu(newPart);
    this.updateTitle();
    this.updateCurrentPart();
    this.updateSplitterVisibility();
    this.update();
    this.fireDidChangeTrackableWidgets();

    [
      toDisposable(() => {
        if (newPart.currentViewContainerId === this.id) {
          newPart.dispose();
        }
        this.unregisterPart(newPart);
        if (!newPart.isDisposed && this.getPartIndex(newPart.id) > -1) {
          this.containerLayout.removeWidget(newPart);
        }
        if (!this.isDisposed) {
          this.update();
          this.updateTitle();
          this.updateCurrentPart();
          this.updateSplitterVisibility();
          this.fireDidChangeTrackableWidgets();
        }
      }),
      this.registerDND(newPart),
      newPart.onDidChangeVisibility(() => {
        this.updateTitle();
        this.updateCurrentPart();
        this.updateSplitterVisibility();
        this.containerLayout.updateSashes();
      }),
      newPart.onCollapsed(() => {
        this.containerLayout.updateCollapsed(newPart, this.enableAnimation);
        this.containerLayout.updateSashes();
        this.updateCurrentPart();
      }),
      newPart.onContextMenu((event) => {
        if (event.button === 2) {
          event.preventDefault();
          event.stopPropagation();
        //   this.contextMenuRenderer.render({ menuPath: this.contextMenuPath, anchor: event, context: this.node });
        }
      }),
      newPart.onTitleChanged(() => this.refreshMenu(newPart)),
      newPart.onDidFocus(() => this.updateCurrentPart(newPart)),
    ].forEach(d => toRemoveWidget.add(d));

    newPart.disposed.connect(() => toRemoveWidget.dispose());
    return toRemoveWidget;
  }

  /**
   * Register a menu action to toggle the visibility of the new part.
   * The menu action is unregistered first to enable refreshing the order of menu actions.
   */
  protected refreshMenu(_part: ViewContainerPart): void {
    // const commandId = this.toggleVisibilityCommandId(part);
    // this.menuRegistry.unregisterMenuAction(commandId);
    // if (!part.wrapped.title.label) {
    //   return;
    // }
    // const { dataset: { visibilityCommandLabel }, caption, label } = part.wrapped.title;
    // const action: MenuAction = {
    //   commandId,
    //   label: visibilityCommandLabel || caption || label,
    //   order: this.getParts().indexOf(part).toString(),
    // };
    // this.menuRegistry.registerMenuAction([...this.contextMenuPath, '1_widgets'], action);
    // if (this.titleOptions) {
    //   this.menuRegistry.registerMenuAction([...SIDE_PANEL_TOOLBAR_CONTEXT_MENU, 'navigation'], action);
    // }
  }

  protected registerDND(part: ViewContainerPart): IDisposable {
    part.headerElement.draggable = true;

    const disposableStore = new DisposableStore();
    disposableStore.add(addEventListener(part.headerElement, 'dragstart', (event) => {
      event.preventDefault();
      const mimeData = new MimeData();
      mimeData.setData('application/vnd.lumino.view-container-factory', () => part);
      const clonedHeader = part.headerElement.cloneNode(true) as HTMLElement;
      clonedHeader.style.width = part.node.style.width;
      clonedHeader.style.opacity = '0.6';
      const drag = new Drag({
        mimeData,
        dragImage: clonedHeader,
        proposedAction: 'move',
        supportedActions: 'move',
      });
      part.node.classList.add('lm-mod-hidden');
      drag.start(event.clientX, event.clientY).then((dropAction) => {
        // The promise is resolved when the drag has ended
        if (dropAction === 'move' && part.currentViewContainerId !== this.id) {
          this.removeWidget(part.wrapped);
          this.lastVisibleState = this.doStoreState();
        }
      });
      setTimeout(() => {
        part.node.classList.remove('lm-mod-hidden');
      }, 0);
    }, false));

    return disposableStore;
  }

  protected getDockPanel(): DockPanel | undefined {
    let panel: DockPanel | undefined;
    let parent = this.parent;
    while (!panel && parent) {
      if (this.isSideDockPanel(parent)) {
        panel = parent as DockPanel;
      }
      else {
        parent = parent.parent;
      }
    }
    return panel;
  }

  protected isSideDockPanel(widget: Widget): boolean {
    const { leftPanelHandler } = this.shell;
    if (widget instanceof DockPanel || widget.id === leftPanelHandler.dockPanel.id) {
      return true;
    }
    return false;
  }

  removeWidget(widget: Widget): boolean {
    const disposable = this.toRemoveWidgets.get(widget.id);
    if (disposable) {
      disposable.dispose();
      return true;
    }
    return false;
  }

  protected unregisterPart(_part: ViewContainerPart): void {
    // const commandId = this.toggleVisibilityCommandId(part);
    // this.commandRegistry.unregisterCommand(commandId);
    // this.menuRegistry.unregisterMenuAction(commandId);
  }

  storeState(): ViewContainer1.State {
    if (!this.isVisible && this.lastVisibleState) {
      return this.lastVisibleState;
    }
    return this.doStoreState();
  }

  protected doStoreState(): ViewContainer1.State {
    const parts = this.getParts();
    const availableSize = this.containerLayout.getAvailableSize();
    const orientation = this.orientation;
    const partStates = parts.map((part) => {
      let size = this.containerLayout.getPartSize(part);
      if (size && size > ViewContainerPart1.HEADER_HEIGHT && orientation === 'vertical') {
        size -= ViewContainerPart1.HEADER_HEIGHT;
      }
      return <ViewContainerPart1.State>{
        widget: part.wrapped,
        partId: part.partId,
        collapsed: part.collapsed,
        hidden: part.isHidden,
        relativeSize: size && availableSize ? size / availableSize : undefined,
        originalContainerId: part.originalContainerId,
        originalContainerTitle: part.originalContainerTitle,
      };
    });
    return { parts: partStates, title: this.titleOptions };
  }

  protected getPartIndex(partId: string | undefined): number {
    if (partId) {
      return this.getParts().findIndex(part => part.id === partId);
    }
    return -1;
  }

  getPartFor(widget: Widget): ViewContainerPart | undefined {
    return this.getParts().find(p => p.wrapped.id === widget.id);
  }

  /**
   * Register a command to toggle the visibility of the new part.
   */
  protected registerPart(_toRegister: ViewContainerPart): void {
    // const commandId = this.toggleVisibilityCommandId(toRegister);
    // this.commandRegistry.registerCommand({ id: commandId }, {
    //   execute: () => {
    //     const toHide = find(this.containerLayout.iter(), part => part.id === toRegister.id);
    //     if (toHide) {
    //       toHide.setHidden(!toHide.isHidden);
    //     }
    //   },
    //   isToggled: () => {
    //     if (!toRegister.canHide) {
    //       return true;
    //     }
    //     const widgetToToggle = find(this.containerLayout.iter(), part => part.id === toRegister.id);
    //     if (widgetToToggle) {
    //       return !widgetToToggle.isHidden;
    //     }
    //     return false;
    //   },
    //   isEnabled: arg => toRegister.canHide && (!this.titleOptions || !(arg instanceof Widget) || (arg instanceof ViewContainer && arg.id === this.id)),
    //   isVisible: arg => !this.titleOptions || !(arg instanceof Widget) || (arg instanceof ViewContainer && arg.id === this.id),
    // });
  }

  protected fireDidChangeTrackableWidgets(): void {
    this.onDidChangeTrackableWidgetsEmitter.fire(this.getTrackableWidgets());
  }

  getTrackableWidgets(): Widget[] {
    return this.getParts().map(w => w.wrapped);
  }

  protected doRestoreState(state: ViewContainer1.State): void {
    this.setTitleOptions(state.title);
    // restore widgets
    for (const part of state.parts) {
      if (part.widget) {
        this.addWidget(part.widget, undefined, part.originalContainerId, part.originalContainerTitle || {} as ViewContainerTitleOptions);
      }
    }
    const partStates = state.parts.filter(partState => some(this.containerLayout.iter(), p => p.partId === partState.partId));

    // Reorder the parts according to the stored state
    for (let index = 0; index < partStates.length; index++) {
      const partState = partStates[index];
      const widget = this.getParts().find(part => part.partId === partState.partId);
      if (widget) {
        this.containerLayout.insertWidget(index, widget);
      }
    }

    // Restore visibility and collapsed state
    const parts = this.getParts();
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const partState = partStates.find(s => part.partId === s.partId);
      if (partState) {
        part.setHidden(partState.hidden);
        part.collapsed = partState.collapsed || !partState.relativeSize;
      }
      else if (part.canHide) {
        part.hide();
      }
      this.refreshMenu(part);
    }

    // Restore part sizes
    waitForRevealed(this).then(() => {
      this.containerLayout.setPartSizes(partStates.map(partState => partState.relativeSize));
      this.updateSplitterVisibility();
    });
  }
}
// ====ViewContainer end====

// ====ViewContainerLayout start====
export namespace ViewContainerLayout1 {

  export interface Options extends SplitLayout.IOptions {
    headerSize: number;
    animationDuration: number;
  }

  export interface Item {
    readonly widget: ViewContainerPart;
  }

}

export class ViewContainerLayout extends SplitLayout {
  constructor(protected options: ViewContainerLayout1.Options, protected readonly splitPositionHandler: SplitPositionHandler) {
    super(options);
  }

  protected get items(): ReadonlyArray<LayoutItem & ViewContainerLayout1.Item> {
    return (this as any)._items as Array<LayoutItem & ViewContainerLayout1.Item>;
  }

  iter(): IterableIterator<ViewContainerPart> {
    return map(this.items, item => item.widget);
  }

  // @ts-expect-error TS2611 `SplitLayout.widgets` is declared as `readonly widgets` but is implemented as a getter.
  get widgets(): ViewContainerPart[] {
    return Array.from(this.iter());
  }

  override attachWidget(index: number, widget: ViewContainerPart): void {
    super.attachWidget(index, widget);
    if (index > -1 && this.parent && this.parent.node.contains(this.widgets[index + 1]?.node)) {
      // Set the correct attach index to the DOM elements.
      const ref = this.widgets[index + 1].node;
      this.parent.node.insertBefore(widget.node, ref);
      this.parent.node.insertBefore(this.handles[index], ref);
      this.parent.fit();
    }
  }

  getPartSize(part: ViewContainerPart): number | undefined {
    if (part.collapsed || part.isHidden) {
      return part.uncollapsedSize;
    }
    if (this.orientation === 'horizontal') {
      return part.node.offsetWidth;
    }
    else {
      return part.node.offsetHeight;
    }
  }

  /**
   * Set the sizes of the view container parts according to the given weights
   * by moving the split handles. This is similar to `setRelativeSizes` defined
   * in `SplitLayout`, but here we properly consider the collapsed / expanded state.
   */
  setPartSizes(weights: (number | undefined)[]): void {
    const parts = this.widgets;
    const availableSize = this.getAvailableSize();

    // Sum up the weights of visible parts
    let totalWeight = 0;
    let weightCount = 0;
    for (let index = 0; index < weights.length && index < parts.length; index++) {
      const part = parts[index];
      const weight = weights[index];
      if (weight && !part.isHidden && !part.collapsed) {
        totalWeight += weight;
        weightCount++;
      }
    }
    if (weightCount === 0 || availableSize === 0) {
      return;
    }

    // Add the average weight for visible parts without weight
    const averageWeight = totalWeight / weightCount;
    for (let index = 0; index < weights.length && index < parts.length; index++) {
      const part = parts[index];
      const weight = weights[index];
      if (!weight && !part.isHidden && !part.collapsed) {
        totalWeight += averageWeight;
      }
    }

    // Apply the weights to compute actual sizes
    let position = 0;
    for (let index = 0; index < weights.length && index < parts.length - 1; index++) {
      const part = parts[index];
      if (!part.isHidden) {
        if (this.orientation === 'vertical') {
          position += this.options.headerSize;
        }
        const weight = weights[index];
        if (part.collapsed) {
          if (weight) {
            part.uncollapsedSize = weight / totalWeight * availableSize;
          }
        }
        else {
          let contentSize = (weight || averageWeight) / totalWeight * availableSize;
          const minSize = part.minSize;
          if (contentSize < minSize) {
            contentSize = minSize;
          }
          position += contentSize;
        }
        this.setHandlePosition(index, position);
        position += this.spacing;
      }
    }
  }

  /**
   * Determine the size of the split panel area that is available for widget content,
   * i.e. excluding part headers and split handles.
   */
  getAvailableSize(): number {
    if (!this.parent || !this.parent.isAttached) {
      return 0;
    }
    const parts = this.widgets;
    const visiblePartCount = parts.filter(part => !part.isHidden).length;
    let availableSize: number;
    if (this.orientation === 'horizontal') {
      availableSize = this.parent.node.offsetWidth;
    }
    else {
      availableSize = this.parent.node.offsetHeight;
      availableSize -= visiblePartCount * this.options.headerSize;
    }
    availableSize -= (visiblePartCount - 1) * this.spacing;
    if (availableSize < 0) {
      return 0;
    }
    return availableSize;
  }

  /**
   * Update a view container part that has been collapsed or expanded. The transition
   * to the new state is animated.
   */
  updateCollapsed(part: ViewContainerPart, enableAnimation: boolean): void {
    const index = this.items.findIndex(item => item.widget === part);
    if (index < 0 || !this.parent || part.isHidden) {
      return;
    }
    // Do not store the height of the "stretched item". Otherwise, we mess up the "hint height".
    // Store the height only if there are other expanded items.
    const currentSize = this.orientation === 'horizontal' ? part.node.offsetWidth : part.node.offsetHeight;
    if (part.collapsed && this.items.some(item => !item.widget.collapsed && !item.widget.isHidden)) {
      part.uncollapsedSize = currentSize;
    }

    if (!enableAnimation || this.options.animationDuration <= 0) {
      MessageLoop.postMessage(this.parent, Widget.Msg.FitRequest);
      return;
    }
    let startTime: number | undefined;
    const duration = this.options.animationDuration;
    const direction = part.collapsed ? 'collapse' : 'expand';
    let fullSize: number;
    if (direction === 'collapse') {
      fullSize = currentSize - this.options.headerSize;
    }
    else {
      fullSize = Math.max((part.uncollapsedSize || 0) - this.options.headerSize, part.minSize);
      if (this.items.filter(item => !item.widget.collapsed && !item.widget.isHidden).length === 1) {
        // Expand to full available size
        fullSize = Math.max(fullSize, this.getAvailableSize());
      }
    }

    // The update function is called on every animation frame until the predefined duration has elapsed.
    const updateFunc = (time: number) => {
      if (!this.parent) {
        part.animatedSize = undefined;
        return;
      }
      if (startTime === undefined) {
        startTime = time;
      }
      if (time - startTime < duration) {
        // Render an intermediate state for the animation
        const t = this.tween((time - startTime) / duration);
        if (direction === 'collapse') {
          part.animatedSize = (1 - t) * fullSize;
        }
        else {
          part.animatedSize = t * fullSize;
        }
        requestAnimationFrame(updateFunc);
      }
      else {
        // The animation is finished
        if (direction === 'collapse') {
          part.animatedSize = undefined;
        }
        else {
          part.animatedSize = fullSize;
          // Request another frame to reset the part to variable size
          requestAnimationFrame(() => {
            part.animatedSize = undefined;
            if (this.parent) {
              MessageLoop.sendMessage(this.parent, Widget.Msg.FitRequest);
            }
          });
        }
      }
      MessageLoop.sendMessage(this.parent, Widget.Msg.FitRequest);
    };
    requestAnimationFrame(updateFunc);
  }

  updateSashes(): void {
    const { widgets, handles } = this;
    if (widgets.length !== handles.length) {
      console.warn('Unexpected mismatch between number of widgets and number of handles.');
      return;
    }
    const firstUncollapsed = this.getFirstUncollapsedWidgetIndex();
    const lastUncollapsed = firstUncollapsed === undefined ? undefined : this.getLastUncollapsedWidgetIndex();
    const allHidden = firstUncollapsed === lastUncollapsed;
    for (const [index, handle] of this.handles.entries()) {
      // The or clauses are added for type checking. If they're true, allHidden will also have been true.
      if (allHidden || firstUncollapsed === undefined || lastUncollapsed === undefined) {
        handle.classList.add('sash-hidden');
      }
      else if (index < lastUncollapsed && index >= firstUncollapsed) {
        handle.classList.remove('sash-hidden');
      }
      else {
        handle.classList.add('sash-hidden');
      }
    }
  }

  protected getFirstUncollapsedWidgetIndex(): number | undefined {
    const index = this.widgets.findIndex(widget => !widget.collapsed && !widget.isHidden);
    return index === -1 ? undefined : index;
  }

  protected getLastUncollapsedWidgetIndex(): number | undefined {
    for (let i = this.widgets.length - 1; i >= 0; i--) {
      if (!this.widgets[i].collapsed && !this.widgets[i].isHidden) {
        return i;
      }
    }

    return undefined;
  }

  protected override onFitRequest(msg: Message): void {
    for (const part of this.widgets) {
      const style = part.node.style;
      if (part.animatedSize !== undefined) {
        // The part size has been fixed for animating the transition to collapsed / expanded state
        const fixedSize = `${this.options.headerSize + part.animatedSize}px`;
        style.minHeight = fixedSize;
        style.maxHeight = fixedSize;
      }
      else if (part.collapsed) {
        // The part size is fixed to the header size
        const fixedSize = `${this.options.headerSize}px`;
        style.minHeight = fixedSize;
        style.maxHeight = fixedSize;
      }
      else {
        const minSize = `${this.options.headerSize + part.minSize}px`;
        style.minHeight = minSize;
        style.maxHeight = '';
      }
    }
    super.onFitRequest(msg);
  }

  /**
   * Sinusoidal tween function for smooth animation.
   */
  protected tween(t: number): number {
    return 0.5 * (1 - Math.cos(Math.PI * t));
  }

  setHandlePosition(index: number, position: number): Promise<void> {
    const options: SplitPositionOptions = {
      referenceWidget: this.widgets[index],
      duration: 0,
    };
    return this.splitPositionHandler.setSplitHandlePosition(this.parent as SplitPanel, index, position, options) as Promise<any>;
  }
}
// ====ViewContainerLayout end====
