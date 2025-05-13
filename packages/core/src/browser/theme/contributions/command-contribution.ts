import { AbstractCommand, lodashDebounce } from "@gepick/core/common";
import { IThemeService } from "../theme-service";

export class SelectColorThemeCommand extends AbstractCommand {
  static override Id = 'workbench.action.selectTheme';
  static override Category = 'Preferences';
  static override Label = 'Color Theme';

  constructor(
    @IThemeService protected readonly themeService: IThemeService,
  ) {
    super();
  }

  override execute(): void {
    let resetTo: string | undefined = this.themeService.getCurrentTheme().id;
    const setTheme = (id: string, persist: boolean) => this.themeService.setCurrentTheme(id, persist);
    const previewTheme = lodashDebounce(setTheme, 200);
    const lightThemesSeparator = 'light themes';
    const darkThemesSeparator = 'dark themes';
    const highContrastThemesSeparator = 'high contrast themes';
  }
}
