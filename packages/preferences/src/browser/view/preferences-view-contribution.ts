import { AbstractView, IView } from "@gepick/core/browser";
import { Contribution, createServiceDecorator } from "@gepick/core/common";
import { PreferencesWidget } from "../views/preferences-widget";

@Contribution(IView)
export class PreferencesView extends AbstractView<PreferencesWidget> implements IView {
  constructor() {
    super({
      widgetId: PreferencesWidget.ID,
      widgetName: PreferencesWidget.LABEL,
      defaultWidgetOptions: {
        area: 'main',
      },
    });
  }

  async onShellLayoutInit(): Promise<void> {
    await this.setupView({ activate: true });

    return Promise.resolve(void 0);
  }
}
export const IPreferencesView = createServiceDecorator<IPreferencesView>(PreferencesView.name);
export type IPreferencesView = PreferencesView;
