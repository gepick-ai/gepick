import { IWidgetFactory } from "@gepick/core/browser";
import { Contribution, IServiceContainer, InjectableService } from "@gepick/core/common";
import { GettingStartedWidget, IGettingStartedWidget } from "./getting-started-widget";

@Contribution(IWidgetFactory)
export class GettingStartedFactory extends InjectableService {
  public readonly id = GettingStartedWidget.ID;

  createWidget(container: IServiceContainer) {
    return container.get<IGettingStartedWidget>(IGettingStartedWidget);
  }
}
