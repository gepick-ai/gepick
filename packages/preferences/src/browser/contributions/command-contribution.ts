import { CommandContribution } from "@gepick/core/common";
import { IPreferencesManager } from "@gepick/core/browser";
import { Preference } from "../util/preference-types";
import { IPreferencesView } from "./view-contribution";

export class OpenPreferencesCommand extends CommandContribution {
  static override Category = 'Preferences';
  static override Id = 'preferences:open';
  static override Label = 'Open Settings (UI)';

  constructor(
    @IPreferencesView protected readonly preferencesView: IPreferencesView,
  ) {
    super();
  }

  override async execute(query?: string) {
    const widget = await this.preferencesView.setupView({ activate: true });
    if (typeof query === 'string') {
      widget.setSearchTerm(query);
    }
  }
}

export class ResetPreferencesCommand extends CommandContribution {
  static override Id = 'preferences:reset';
  static override Label = 'Reset Setting';

  constructor(
    @IPreferencesManager protected readonly preferencesManager: IPreferencesManager,
  ) {
    super();
  }

  override execute({ id }: Preference.EditorCommandArgs): void {
    this.preferencesManager.set(id, undefined);
  }

  override isEnabled = Preference.EditorCommandArgs.is;
  override isVisible = Preference.EditorCommandArgs.is;
}
