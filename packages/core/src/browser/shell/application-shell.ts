import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { BoxLayout, BoxPanel, DockLayout, DockPanel, InjectableBaseWidget, Layout, SplitLayout, SplitPanel, Widget } from "../widgets";
import { SidePanel, SidePanelHandler } from "./side-panel";

/**
 * The namespace for `ApplicationShell` class statics.
 */
export namespace ApplicationShell1 {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'top' | 'left' | 'right' | 'bottom';

  /**
   * The _side areas_ are those shell areas that can be collapsed and expanded,
   * i.e. `left`, `right`, and `bottom`.
   */
  export function isSideArea(area?: Area): area is 'left' | 'right' | 'bottom' {
    return area === 'left' || area === 'right' || area === 'bottom';
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

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};
export class ApplicationShell extends InjectableBaseWidget {
  leftPanel: BoxPanel;
  mainPanel: DockPanel;
  options: ApplicationShell1.Options;

  constructor() {
    super();

    this.id = 'theia-app-shell';
    this.options = {
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
  }

  @PostConstruct()
  protected init(): void {
    this.layout = this.createLayout();
  }

  protected createLayout(): Layout {
    // Left Panel
    this.leftPanel = this.createSidePanel();

    // Main Panel
    this.mainPanel = this.createMainPanel();

    // 创建一个左中右分割布局面板
    const leftCenterRightLayoutPanel = new SplitPanel({ layout: this.createSplitLayout([this.leftPanel, this.mainPanel], [1, 4], { orientation: 'horizontal', spacing: 0 }) });

    // 创建一个从上到下的单列布局
    const boxLayout = this.createBoxLayout([leftCenterRightLayoutPanel], [1], { direction: 'top-to-bottom', spacing: 0 });

    return boxLayout;
  }

  protected createSidePanel(): BoxPanel {
    const sidebarHandler = new SidePanelHandler();
    sidebarHandler.createSidePanel(this.options.leftPanel);

    return sidebarHandler.container;
  }

  /**
   * Create the dock panel in the main shell area.
   */
  protected createMainPanel(): DockPanel {
    const mainPanel = new DockPanel({
      mode: 'multiple-document',
      spacing: 0,
    });

    return mainPanel;
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
}

export const IApplicationShell = createServiceDecorator<IApplicationShell>(ApplicationShell.name);
export type IApplicationShell = ApplicationShell;
