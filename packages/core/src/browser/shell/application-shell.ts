import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { BoxLayout, BoxPanel, DockPanel, InjectableBaseWidget, Layout, Panel, PanelLayout, SplitLayout, SplitPanel, Widget } from "../widgets";
import { GepickDockPanel } from "./side-panel";

export class ApplicationShell extends InjectableBaseWidget {
  leftPanel: BoxPanel;
  mainPanel: DockPanel;

  constructor() {
    super();

    this.id = 'theia-app-shell';
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
   * Create the dock panel in the main shell area.
   */
  protected createMainPanel(): DockPanel {
    const mainPanel = new DockPanel({
      mode: 'multiple-document',
      spacing: 0,
    });

    return mainPanel;
  }

  protected createSidePanel(): BoxPanel {
    // sidebar
    const sidebarLayout = new PanelLayout();
    // sidebarLayout.addWidget(this.tabBar);
    const sidebar = new Panel({ layout: sidebarLayout });

    // content
    const contentLayout = new BoxLayout({ direction: "top-to-bottom", spacing: 0 });
    contentLayout.addWidget(this.createGepickSidePanel());
    const content = new BoxPanel({ layout: contentLayout });

    // sidePanel = sidebar + content
    const sidePanelLayout = new BoxLayout({ direction: "left-to-right", spacing: 0 });
    sidePanelLayout.addWidget(sidebar);
    sidePanelLayout.addWidget(content);
    const sidePanel = new BoxPanel({ layout: sidePanelLayout });

    sidePanel.id = 'theia-left-content-panel';

    return sidePanel;
  }

  protected createGepickSidePanel(): GepickDockPanel {
    const sidePanel = new GepickDockPanel({
      mode: 'single-document',
    });

    sidePanel.widgetActivated.connect((_sender, widget) => {
      // eslint-disable-next-line no-console
      console.log("🚀 ~ ApplicationShell ~ sidePanel.widgetActivated.connect ~ widget:", widget);
    }, this);
    sidePanel.widgetAdded.connect(this.handleWidgetAdded, this);
    sidePanel.widgetRemoved.connect(this.handleWidgetRemoved, this);
    return sidePanel;
  }

  protected handleWidgetAdded() {}

  protected handleWidgetRemoved() {}
}

export const IApplicationShell = createServiceDecorator<IApplicationShell>(ApplicationShell.name);
export type IApplicationShell = ApplicationShell;
