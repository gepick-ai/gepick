/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import PerfectScrollbar from 'perfect-scrollbar';
import { TabBar, Title, Widget } from '@lumino/widgets';
import { ElementInlineStyle, VirtualDOM, VirtualElement, h } from '@lumino/virtualdom';
import { Signal, Slot } from '@lumino/signaling';
import { Message } from '@lumino/messaging';
import { ArrayExt } from '@lumino/algorithm';
import { ElementExt } from '@lumino/domutils';
import { DisposableStore, toDisposable } from '@gepick/core/common';
import { WidgetDecoration } from '../widgets/widget-decoration';

export function notEmpty<T>(arg: T | undefined | null): arg is T {
  return arg !== undefined && arg !== null;
}

/** The class name added to hidden content nodes, which are required to render vertical side bars. */
const HIDDEN_CONTENT_CLASS = 'theia-TabBar-hidden-content';

export const TabBarRendererFactory = Symbol('TabBarRendererFactory');

/**
 * Size information of DOM elements used for rendering tabs in side bars.
 */
export interface SizeData {
  width: number;
  height: number;
}

/**
 * Extension of the rendering data used for tabs in side bars of the application shell.
 */
export interface SideBarRenderData extends TabBar.IRenderData<Widget> {
  labelSize?: SizeData;
  iconSize?: SizeData;
  paddingTop?: number;
  paddingBottom?: number;
  visible?: boolean;
}

/**
 * A tab bar renderer that offers a context menu. In addition, this renderer is able to
 * set an explicit position and size on the icon and label of each tab in a side bar.
 * This is necessary because the elements of side bar tabs are rotated using the CSS
 * `transform` property, disrupting the browser's ability to arrange those elements
 * automatically.
 */
export class TabBarRenderer extends TabBar.Renderer {
  protected readonly toDispose = new DisposableStore();
  protected readonly toDisposeOnTabBar = new DisposableStore();

  protected _tabBar?: TabBar<Widget>;

  /**
   * A reference to the tab bar is required in order to activate it when a context menu
   * is requested.
   */
  set tabBar(tabBar: TabBar<Widget> | undefined) {
    if (this.toDispose.isDisposed) {
      throw new Error('disposed');
    }
    if (this._tabBar === tabBar) {
      return;
    }
    this.toDisposeOnTabBar.dispose();
    this.toDispose.add(this.toDisposeOnTabBar);
    this._tabBar = tabBar;
    if (tabBar) {
      const listener: Slot<Widget, TabBar.ITabCloseRequestedArgs<Widget>> = (_, { title }) => this.resetDecorations(title);
      tabBar.tabCloseRequested.connect(listener);
      // this.toDisposeOnTabBar.add(toDisposable(() => tabBar.tabCloseRequested.disconnect(listener)));
    }
    this.resetDecorations();
  }

  get tabBar(): TabBar<Widget> | undefined {
    return this._tabBar;
  }

  /**
   * Render tabs with the default DOM structure, but additionally register a context menu listener.
   * @param {SideBarRenderData} data Data used to render the tab.
   * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
   * @param {boolean} isPartOfHiddenTabBar An optional check which determines if the tab is in the hidden horizontal tab bar.
   * @returns {VirtualElement} The virtual element of the rendered tab.
   */
  override renderTab(data: SideBarRenderData, isInSidePanel?: boolean, isPartOfHiddenTabBar?: boolean): VirtualElement {
    const title = data.title;
    const id = this.createTabId(title, isPartOfHiddenTabBar);
    const key = this.createTabKey(data);
    const style = this.createTabStyle(data);
    const className = this.createTabClass(data);
    const dataset = this.createTabDataset(data);
    const closeIconTitle = data.title.className.includes('theia-mod-pinned') ? "Unpin" : "Close";

    return h.li(
      {
        key,
        className,
        id,
        style,
        dataset,
        onauxclick: (e: MouseEvent) => {
          // If user closes the tab using mouse wheel, nothing should be pasted to an active editor
          e.preventDefault();
        },
      },
      h.div(
        { className: 'theia-tab-icon-label' },
        this.renderIcon(data, isInSidePanel),
        this.renderLabel(data, isInSidePanel),
      ),
      h.div({
        className: 'lm-TabBar-tabCloseIcon action-label',
        title: closeIconTitle,
        onclick: () => {},
      }),
    );
  }

  /**
   * If size information is available for the label and icon, set an explicit height on the tab.
   * The height value also considers padding, which should be derived from CSS settings.
   */
  override createTabStyle(data: SideBarRenderData): ElementInlineStyle {
    const zIndex = `${data.zIndex}`;
    const labelSize = data.labelSize;
    const iconSize = data.iconSize;
    let height: string | undefined;
    if (labelSize || iconSize) {
      const labelHeight = labelSize ? labelSize.width : 0;
      const iconHeight = iconSize ? iconSize.height : 0;
      let paddingTop = data.paddingTop || 0;
      if (labelHeight > 0 && iconHeight > 0) {
        // Leave some extra space between icon and label
        paddingTop = paddingTop * 1.5;
      }
      const paddingBottom = data.paddingBottom || 0;
      height = `${labelHeight + iconHeight + paddingTop + paddingBottom}px`;
    }
    return { zIndex, height };
  }

  override createTabClass(data: SideBarRenderData): string {
    let tabClass = super.createTabClass(data);
    if (!(data.visible ?? true)) {
      tabClass += ' lm-mod-invisible';
    }
    return tabClass;
  }

  /**
   * If size information is available for the label, set it as inline style.
   * Tab padding and icon size are also considered in the `top` position.
   * @param {SideBarRenderData} data Data used to render the tab.
   * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
   * @returns {VirtualElement} The virtual element of the rendered label.
   */
  override renderLabel(data: SideBarRenderData, isInSidePanel?: boolean): VirtualElement {
    const labelSize = data.labelSize;
    const iconSize = data.iconSize;
    let width: string | undefined;
    let height: string | undefined;
    let top: string | undefined;
    if (labelSize) {
      width = `${labelSize.width}px`;
      height = `${labelSize.height}px`;
    }
    if (data.paddingTop || iconSize) {
      const iconHeight = iconSize ? iconSize.height : 0;
      let paddingTop = data.paddingTop || 0;
      if (iconHeight > 0) {
        // Leave some extra space between icon and label
        paddingTop = paddingTop * 1.5;
      }
      top = `${paddingTop + iconHeight}px`;
    }
    const style: ElementInlineStyle = { width, height, top };
    // No need to check for duplicate labels if the tab is rendered in the side panel (title is not displayed),
    // or if there are less than two files in the tab bar.
    if (isInSidePanel || (this.tabBar && this.tabBar.titles.length < 2)) {
      return h.div({ className: 'lm-TabBar-tabLabel', style }, data.title.label);
    }
    const originalToDisplayedMap = this.findDuplicateLabels([...this.tabBar!.titles]);
    const labelDetails: string | undefined = originalToDisplayedMap.get(data.title.caption);
    if (labelDetails) {
      return h.div({ className: 'lm-TabBar-tabLabelWrapper' }, h.div({ className: 'lm-TabBar-tabLabel', style }, data.title.label), h.div({ className: 'lm-TabBar-tabLabelDetails', style }, labelDetails));
    }
    return h.div({ className: 'lm-TabBar-tabLabel', style }, data.title.label);
  }

  /**
   * Find duplicate labels from the currently opened tabs in the tab bar.
   * Return the appropriate partial paths that can distinguish the identical labels.
   *
   * E.g., a/p/index.ts => a/..., b/p/index.ts => b/...
   *
   * To prevent excessively long path displayed, show at maximum three levels from the end by default.
   * @param {Title<Widget>[]} titles Array of titles in the current tab bar.
   * @returns {Map<string, string>} A map from each tab's original path to its displayed partial path.
   */
  findDuplicateLabels(titles: Title<Widget>[]): Map<string, string> {
    // Filter from all tabs to group them by the distinct label (file name).
    // E.g., 'foo.js' => {0 (index) => 'a/b/foo.js', '2 => a/c/foo.js' },
    //       'bar.js' => {1 => 'a/d/bar.js', ...}
    const labelGroups = new Map<string, Map<number, string>>();
    titles.forEach((title, index) => {
      if (!labelGroups.has(title.label)) {
        labelGroups.set(title.label, new Map<number, string>());
      }
      labelGroups.get(title.label)!.set(index, title.caption);
    });

    const originalToDisplayedMap = new Map<string, string>();
    // Parse each group of editors with the same label.
    labelGroups.forEach((labelGroup) => {
      // Filter to get groups that have duplicates.
      if (labelGroup.size > 1) {
        const paths: string[][] = [];
        let maxPathLength = 0;
        labelGroup.forEach((pathStr, index) => {
          const steps = pathStr.split('/');
          maxPathLength = Math.max(maxPathLength, steps.length);
          paths[index] = (steps.slice(0, steps.length - 1));
          // By default, show at maximum three levels from the end.
          let defaultDisplayedPath = steps.slice(-4, -1).join('/');
          if (steps.length > 4) {
            defaultDisplayedPath = `.../${defaultDisplayedPath}`;
          }
          originalToDisplayedMap.set(pathStr, defaultDisplayedPath);
        });

        // Iterate through the steps of the path from the left to find the step that can distinguish it.
        // E.g., ['root', 'foo', 'c'], ['root', 'bar', 'd'] => 'foo', 'bar'
        let i = 0;
        while (i < maxPathLength - 1) {
          // Store indexes of all paths that have the identical element in each step.
          const stepOccurrences = new Map<string, number[]>();
          // Compare the current step of all paths
          paths.forEach((path, index) => {
            const step = path[i];
            if (path.length > 0) {
              if (i > path.length - 1) {
                paths[index] = [];
              }
              else if (!stepOccurrences.has(step)) {
                stepOccurrences.set(step, [index]);
              }
              else {
                stepOccurrences.get(step)!.push(index);
              }
            }
          });
          // Set the displayed path for each tab.
          stepOccurrences.forEach((indexArr, displayedPath) => {
            if (indexArr.length === 1) {
              const originalPath = labelGroup.get(indexArr[0]);
              if (originalPath) {
                const originalElements = originalPath.split('/');
                const displayedElements = displayedPath.split('/');
                if (originalElements.slice(-2)[0] !== displayedElements.slice(-1)[0]) {
                  displayedPath += '/...';
                }
                if (originalElements[0] !== displayedElements[0]) {
                  displayedPath = `.../${displayedPath}`;
                }
                originalToDisplayedMap.set(originalPath, displayedPath);
                paths[indexArr[0]] = [];
              }
            }
          });
          i++;
        }
      }
    });
    return originalToDisplayedMap;
  }

  /**
   * If size information is available for the icon, set it as inline style. Tab padding
   * is also considered in the `top` position.
   * @param {SideBarRenderData} data Data used to render the tab icon.
   * @param {boolean} isInSidePanel An optional check which determines if the tab is in the side-panel.
   */
  override renderIcon(data: SideBarRenderData, isInSidePanel?: boolean): VirtualElement {
    // if (!isInSidePanel && this.iconThemeService && this.iconThemeService.current === 'none') {
    //   return h.div();
    // }
    let top: string | undefined;
    if (data.paddingTop) {
      top = `${data.paddingTop || 0}px`;
    }
    const style: ElementInlineStyle = { top };
    const baseClassName = this.createIconClass(data);

    const overlayIcons: VirtualElement[] = [];
    const decorationData = this.getDecorationData(data.title, 'iconOverlay');

    // Check if the tab has decoration markers to be rendered on top.
    if (decorationData.length > 0) {
      const baseIcon: VirtualElement = h.div({ className: baseClassName, style }, data.title.iconLabel);
      const wrapperClassName: string = WidgetDecoration.Styles.ICON_WRAPPER_CLASS;
      const decoratorSizeClassName: string = isInSidePanel ? WidgetDecoration.Styles.DECORATOR_SIDEBAR_SIZE_CLASS : WidgetDecoration.Styles.DECORATOR_SIZE_CLASS;

      decorationData
        .filter(notEmpty)
        .map(overlay => [overlay.position, overlay] as [WidgetDecoration.IconOverlayPosition, WidgetDecoration.IconOverlay | WidgetDecoration.IconClassOverlay])
        .forEach(([position, overlay]) => {
          const iconAdditionalClasses: string[] = [decoratorSizeClassName, WidgetDecoration.IconOverlayPosition.getStyle(position, isInSidePanel)];
          const overlayIconStyle = (color?: string) => {
            if (color === undefined) {
              return {};
            }
            return { color };
          };
          // Parse the optional background (if it exists) of the overlay icon.
          if (overlay.background) {
            const backgroundIconClassName = this.getIconClass(overlay.background.shape, iconAdditionalClasses);
            overlayIcons.push(
              h.div({ key: `${data.title.label}-background`, className: backgroundIconClassName, style: overlayIconStyle(overlay.background.color) }),
            );
          }
          // Parse the overlay icon.
          const overlayIcon = (overlay as WidgetDecoration.IconOverlay).icon || (overlay as WidgetDecoration.IconClassOverlay).iconClass;
          const overlayIconClassName = this.getIconClass(overlayIcon, iconAdditionalClasses);
          overlayIcons.push(
            h.span({ key: data.title.label, className: overlayIconClassName, style: overlayIconStyle(overlay.color) }),
          );
        });
      return h.div({ className: wrapperClassName, style }, [baseIcon, ...overlayIcons]);
    }
    return h.div({ className: baseClassName, style }, data.title.iconLabel);
  }

  /**
   * Get the decoration data given the tab URI and the decoration data type.
   * @param {string} title The title.
   * @param {K} key The type of the decoration data.
   */
  protected getDecorationData<K extends keyof WidgetDecoration.Data>(title: Title<Widget>, key: K): WidgetDecoration.Data[K][] {
    return this.getDecorations(title).filter(data => data[key] !== undefined).map(data => data[key]);
  }

  /**
   * Get all available decorations of a given tab.
   * @param {string} title The widget title.
   */
  protected getDecorations(_: Title<Widget>): WidgetDecoration.Data[] {
    return [];
  }

  /**
   * Get the class of an icon.
   * @param {string | string[]} iconName The name of the icon.
   * @param {string[]} additionalClasses Additional classes of the icon.
   */
  protected getIconClass(iconName: string | string[], additionalClasses: string[] = []): string {
    const iconClass = (typeof iconName === 'string') ? ['a', 'fa', `fa-${iconName}`] : ['a'].concat(iconName);
    return iconClass.concat(additionalClasses).join(' ');
  }

  /**
   * Generate ID for an entry in the tab bar
   * @param {Title<Widget>} title Title of the widget controlled by this tab bar
   * @param {boolean} isPartOfHiddenTabBar Tells us if this entry is part of the hidden horizontal tab bar.
   *      If yes, add a suffix to differentiate it's ID from the entry in the visible tab bar
   * @returns {string} DOM element ID
   */
  createTabId(title: Title<Widget>, isPartOfHiddenTabBar: boolean = false): string {
    return `shell-tab-${title.owner.id}${isPartOfHiddenTabBar ? '-hidden' : ''}`;
  }

  protected readonly decorations = new Map<Title<Widget>, WidgetDecoration.Data[]>();

  protected resetDecorations(title?: Title<Widget>): void {
    if (title) {
      this.decorations.delete(title);
    }
    else {
      this.decorations.clear();
    }
    if (this.tabBar) {
      this.tabBar.update();
    }
  }
}

/**
 * A specialized tab bar for the main and bottom areas.
 */
export class ScrollableTabBar extends TabBar<Widget> {
  protected scrollBar?: PerfectScrollbar;

  private scrollBarFactory: () => PerfectScrollbar;
  private pendingReveal?: Promise<void>;

  constructor(options?: TabBar.IOptions<Widget> & PerfectScrollbar.Options) {
    super(options);
    this.scrollBarFactory = () => new PerfectScrollbar(this.node, options);
  }

  protected override onAfterAttach(msg: Message): void {
    if (!this.scrollBar) {
      this.scrollBar = this.scrollBarFactory();
    }
    super.onAfterAttach(msg);
  }

  protected override onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    if (this.scrollBar) {
      this.scrollBar.destroy();
      this.scrollBar = undefined;
    }
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    if (this.scrollBar) {
      this.scrollBar.update();
    }
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    if (this.scrollBar) {
      if (this.currentIndex >= 0) {
        this.revealTab(this.currentIndex);
      }
      this.scrollBar.update();
    }
  }

  /**
   * Reveal the tab with the given index by moving the scroll bar if necessary.
   */
  revealTab(index: number): Promise<void> {
    if (this.pendingReveal) {
      // A reveal has already been scheduled
      return this.pendingReveal;
    }
    const result = new Promise<void>((resolve) => {
      // The tab might not have been created yet, so wait until the next frame
      window.requestAnimationFrame(() => {
        const tab = this.contentNode.children[index] as HTMLElement;
        if (tab && this.isVisible) {
          const parent = this.node;
          if (this.orientation === 'horizontal') {
            const scroll = parent.scrollLeft;
            const left = tab.offsetLeft;
            if (scroll > left) {
              parent.scrollLeft = left;
            }
            else {
              const right = left + tab.clientWidth - parent.clientWidth;
              if (scroll < right && tab.clientWidth < parent.clientWidth) {
                parent.scrollLeft = right;
              }
            }
          }
          else {
            const scroll = parent.scrollTop;
            const top = tab.offsetTop;
            if (scroll > top) {
              parent.scrollTop = top;
            }
            else {
              const bottom = top + tab.clientHeight - parent.clientHeight;
              if (scroll < bottom && tab.clientHeight < parent.clientHeight) {
                parent.scrollTop = bottom;
              }
            }
          }
        }
        if (this.pendingReveal === result) {
          this.pendingReveal = undefined;
        }
        resolve();
      });
    });
    this.pendingReveal = result;
    return result;
  }
}

/**
 * A specialized tab bar for side areas.
 */
export class SideTabBar extends ScrollableTabBar {
  private static readonly DRAG_THRESHOLD = 5;

  /**
   * Emitted when a tab is added to the tab bar.
   */
  readonly tabAdded = new Signal<this, { title: Title<Widget> }>(this);
  /**
   * Side panels can be collapsed by clicking on the currently selected tab. This signal is
   * emitted when the mouse is released on the selected tab without initiating a drag.
   */
  readonly collapseRequested = new Signal<this, Title<Widget>>(this);

  private mouseData?: {
    pressX: number;
    pressY: number;
    mouseDownTabIndex: number;
  };

  constructor(options?: TabBar.IOptions<Widget> & PerfectScrollbar.Options) {
    super(options);

    // Create the hidden content node (see `hiddenContentNode` for explanation)
    const hiddenContent = document.createElement('ul');
    hiddenContent.className = HIDDEN_CONTENT_CLASS;
    this.node.appendChild(hiddenContent);
  }

  /**
   * Tab bars of the left and right side panel are arranged vertically by rotating their labels.
   * Rotation is realized with the CSS `transform` property, which disrupts the browser's ability
   * to arrange the involved elements automatically. Therefore the elements are arranged explicitly
   * by the TabBarRenderer using inline `height` and `top` styles. However, the size of labels
   * must still be computed by the browser, so the rendering is performed in two steps: first the
   * tab bar is rendered horizontally inside a _hidden content node_, then it is rendered again
   * vertically inside the proper content node. After the first step, size information is gathered
   * from all labels so it can be applied during the second step.
   */
  get hiddenContentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(HIDDEN_CONTENT_CLASS)[0] as HTMLUListElement;
  }

  override insertTab(index: number, value: Title<Widget> | Title.IOptions<Widget>): Title<Widget> {
    const result = super.insertTab(index, value);
    this.tabAdded.emit({ title: result });
    return result;
  }

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.renderTabBar();
  }

  protected override onUpdateRequest(): void {
    this.renderTabBar();
    if (this.scrollBar) {
      this.scrollBar.update();
    }
  }

  /**
   * Render the tab bar in the _hidden content node_ (see `hiddenContentNode` for explanation),
   * then gather size information for labels and render it again in the proper content node.
   */
  protected renderTabBar(): void {
    if (this.isAttached) {
      // Render into the invisible node
      this.renderTabs(this.hiddenContentNode);
      // Await a rendering frame
      window.requestAnimationFrame(() => {
        const hiddenContent = this.hiddenContentNode;
        const n = hiddenContent.children.length;
        const renderData = new Array<Partial<SideBarRenderData>>(n);
        for (let i = 0; i < n; i++) {
          const hiddenTab = hiddenContent.children[i];
          // Extract tab padding from the computed style
          const tabStyle = window.getComputedStyle(hiddenTab);
          const rd: Partial<SideBarRenderData> = {
            paddingTop: Number.parseFloat(tabStyle.paddingTop!),
            paddingBottom: Number.parseFloat(tabStyle.paddingBottom!),
          };
          // Extract label size from the DOM
          const labelElements = hiddenTab.getElementsByClassName('p-TabBar-tabLabel');
          if (labelElements.length === 1) {
            const label = labelElements[0];
            rd.labelSize = { width: label.clientWidth, height: label.clientHeight };
          }
          // Extract icon size from the DOM
          const iconElements = hiddenTab.getElementsByClassName('p-TabBar-tabIcon');
          if (iconElements.length === 1) {
            const icon = iconElements[0];
            rd.iconSize = { width: icon.clientWidth, height: icon.clientHeight };
          }
          renderData[i] = rd;
        }
        // Render into the visible node
        this.renderTabs(this.contentNode, renderData);
      });
    }
  }

  /**
   * Render the tab bar using the given DOM element as host. The optional `renderData` is forwarded
   * to the TabBarRenderer.
   */
  protected renderTabs(host: HTMLElement, renderData?: Partial<SideBarRenderData>[]): void {
    const titles = this.titles;
    const n = titles.length;
    const renderer = this.renderer as TabBarRenderer;
    const currentTitle = this.currentTitle;
    const content = new Array<VirtualElement>(n);
    for (let i = 0; i < n; i++) {
      const title = titles[i];
      const current = title === currentTitle;
      const zIndex = current ? n : n - i - 1;
      let rd: SideBarRenderData;
      if (renderData && i < renderData.length) {
        rd = { title, current, zIndex, ...renderData[i] };
      }
      else {
        rd = { title, current, zIndex };
      }
      content[i] = renderer.renderTab(rd);
    }
    VirtualDOM.render(content, host);
  }

  /**
   * The following event processing is used to generate `collapseRequested` signals
   * when the mouse goes up on the currently selected tab without too much movement
   * between `mousedown` and `mouseup`. The movement threshold is the same that
   * is used by the superclass to detect a drag event. The `allowDeselect` option
   * of the TabBar constructor cannot be used here because it is triggered when the
   * mouse goes down, and thus collides with dragging.
   */
  override handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this.onMouseDown(event as MouseEvent);
        super.handleEvent(event);
        break;
      case 'mouseup':
        super.handleEvent(event);
        this.onMouseUp(event as MouseEvent);
        break;
      case 'mousemove':
        this.onMouseMove(event as MouseEvent);
        super.handleEvent(event);
        break;
      default:
        super.handleEvent(event);
    }
  }

  private onMouseDown(event: MouseEvent): void {
    // Check for left mouse button and current mouse status
    if (event.button !== 0 || this.mouseData) {
      return;
    }

    // Check whether the mouse went down on the current tab
    const tabs = this.contentNode.children;
    const index = ArrayExt.findFirstIndex(tabs, tab => ElementExt.hitTest(tab, event.clientX, event.clientY));
    if (index < 0 || index !== this.currentIndex) {
      return;
    }

    // Check whether the close button was clicked
    const icon = tabs[index].querySelector(this.renderer.closeIconSelector);
    if (icon && icon.contains(event.target as HTMLElement)) {
      return;
    }

    this.mouseData = {
      pressX: event.clientX,
      pressY: event.clientY,
      mouseDownTabIndex: index,
    };
  }

  private onMouseUp(event: MouseEvent): void {
    // Check for left mouse button and current mouse status
    if (event.button !== 0 || !this.mouseData) {
      return;
    }

    // Check whether the mouse went up on the current tab
    const mouseDownTabIndex = this.mouseData.mouseDownTabIndex;
    this.mouseData = undefined;
    const tabs = this.contentNode.children;
    const index = ArrayExt.findFirstIndex(tabs, tab => ElementExt.hitTest(tab, event.clientX, event.clientY));
    if (index < 0 || index !== mouseDownTabIndex) {
      return;
    }

    // Collapse the side bar
    this.collapseRequested.emit(this.titles[index]);
  }

  private onMouseMove(event: MouseEvent): void {
    // Check for left mouse button and current mouse status
    if (event.button !== 0 || !this.mouseData) {
      return;
    }

    const data = this.mouseData;
    const dx = Math.abs(event.clientX - data.pressX);
    const dy = Math.abs(event.clientY - data.pressY);
    const threshold = SideTabBar.DRAG_THRESHOLD;
    if (dx >= threshold || dy >= threshold) {
      this.mouseData = undefined;
    }
  }
}
