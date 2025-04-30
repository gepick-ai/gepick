import { AbstractWidgetFactory } from "@gepick/core/browser";
import { IServiceContainer } from "@gepick/core/common";
import { GettingStartedWidget, IGettingStartedWidget } from "./getting-started-widget";

export class GettingStartedFactory extends AbstractWidgetFactory {
  public override readonly id = GettingStartedWidget.ID;

  createWidget(container: IServiceContainer) {
    return container.get<IGettingStartedWidget>(IGettingStartedWidget);
  }
}
