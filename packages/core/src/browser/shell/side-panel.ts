import { Signal } from "@lumino/signaling";
import { DockPanel, Widget } from "@lumino/widgets";

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

export class GepickDockPanel extends DockPanel {
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

  override addWidget(widget: Widget, options?: DockPanel.IAddOptions): void {
    if (this.mode === 'single-document' && widget.parent === this) {
      return;
    }
    super.addWidget(widget, options);
    this.widgetAdded.emit(widget);
  }

  override activateWidget(widget: Widget): void {
    super.activateWidget(widget);
    this.widgetActivated.emit(widget);
  }

  protected override onChildRemoved(msg: Widget.ChildMessage): void {
    super.onChildRemoved(msg);
    this.widgetRemoved.emit(msg.child);
  }
}
