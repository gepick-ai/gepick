import { ViewContribution } from "@gepick/core/browser";
import { createServiceDecorator } from "@gepick/core/common";
import { PreferencesWidget } from "../views/preferences-widget";

export class PreferencesView extends ViewContribution<PreferencesWidget> {
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
