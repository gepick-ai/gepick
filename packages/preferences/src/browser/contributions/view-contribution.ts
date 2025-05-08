import { AbstractView } from "@gepick/core/browser";
import { createServiceDecorator } from "@gepick/core/common";
import { PreferencesWidget } from "../views/preferences-widget";

export class PreferencesView extends AbstractView<PreferencesWidget> {
  constructor() {
    super({
      widgetId: PreferencesWidget.ID,
      widgetName: PreferencesWidget.LABEL,
      defaultWidgetOptions: {
        area: 'right',
      },
    });
  }

  async onShellLayoutInit(): Promise<void> {
    this.setupView({ activate: false });
  }
}
export const IPreferencesView = createServiceDecorator<IPreferencesView>(PreferencesView.name);
export type IPreferencesView = PreferencesView;
