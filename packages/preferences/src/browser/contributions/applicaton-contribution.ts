import { ApplicationContribution, IPreferencesService } from "@gepick/core/browser";

export class PreferencesApplicationContribution extends ApplicationContribution {
  constructor(
    @IPreferencesService protected readonly preferencesService: IPreferencesService,
  ) {
    super();
  }

  override onApplicationStart(): void {
    this.preferencesService.ready.then(() => {
      const _preferences: [string, unknown][] = [];
    });
  }
}
