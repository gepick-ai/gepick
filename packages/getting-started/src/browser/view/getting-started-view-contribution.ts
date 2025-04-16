import { AbstractView, IView } from "@gepick/core/browser";
import { Contribution } from "@gepick/core/common";
import { GettingStartedWidget } from "../getting-started-widget";

@Contribution(IView)
export class GettingStartedViewContribution extends AbstractView<GettingStartedWidget> implements IView {
  async onShellLayoutInit(): Promise<void> {
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
