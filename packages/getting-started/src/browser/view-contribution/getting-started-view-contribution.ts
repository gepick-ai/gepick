import { AbstractViewContribution, IViewContribution } from "@gepick/core/browser";
import { Contribution } from "@gepick/core/common";
import { GettingStartedWidget } from "../getting-started-widget";

@Contribution(IViewContribution)
export class GettingStartedViewContribution extends AbstractViewContribution<GettingStartedWidget> implements IViewContribution {
  async initializeLayout(): Promise<void> {
    this.setupOptions({
      widgetId: GettingStartedWidget.ID,
      widgetName: GettingStartedWidget.LABEL,
      defaultWidgetOptions: {
        area: "main",
      },
    });
    await this.setupView({ reveal: true, activate: true });
  }
}
