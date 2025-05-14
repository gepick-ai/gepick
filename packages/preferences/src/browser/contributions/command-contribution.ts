import { AbstractCommand } from "@gepick/core/common";
import { IPreferencesService } from "@gepick/core/browser";
import { Preference } from "../util/preference-types";
import { IPreferencesView } from "./view-contribution";

export class OpenPreferencesCommand extends AbstractCommand {
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

export class ResetPreferencesCommand extends AbstractCommand {
  static override Id = 'preferences:reset';
  static override Label = 'Reset Setting';

  constructor(
    @IPreferencesService protected readonly preferenceService: IPreferencesService,
  ) {
    super();
  }

  override execute({ id }: Preference.EditorCommandArgs): void {
    this.preferenceService.set(id, undefined, undefined);
  }

  override isEnabled = Preference.EditorCommandArgs.is;
  override isVisible = Preference.EditorCommandArgs.is;
}
