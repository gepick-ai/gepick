import { ReactWidget } from "@gepick/core/browser";
import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import "./style/index.css";

export class GettingStartedWidget extends ReactWidget {
  /**
   * The widget `id`.
   */
  static readonly ID = 'getting-started-widget';
  /**
   * The widget `label` which is used for display purposes.
   */
  static readonly LABEL = 'Welcome';

  @PostConstruct()
  init() {
    this.id = GettingStartedWidget.ID;
    this.title.label = GettingStartedWidget.LABEL;
    this.title.closable = true;

    this.update();
  }

  protected override render(): React.ReactNode {
    return <div className="gs-container">Gepick Browser Example</div>;
  }
}

export const IGettingStartedWidget = createServiceDecorator<IGettingStartedWidget>(GettingStartedWidget.name);
export type IGettingStartedWidget = GettingStartedWidget;
