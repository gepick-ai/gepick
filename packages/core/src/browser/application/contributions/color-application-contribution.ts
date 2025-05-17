import { IColorService, IThemePartProvider, IThemeService } from "../../theme";
import { ApplicationContribution } from "../application-contribution";

export class ColorApplicationContribution extends ApplicationContribution {
  constructor(
    @IThemePartProvider protected readonly themePartProvider: IThemePartProvider,
    @IColorService protected readonly colorService: IColorService,
    @IThemeService protected readonly themeService: IThemeService,

  ) {
    super();
  }

  override onApplicationStart() {
    const themeParts = this.themePartProvider.getContributions();

    themeParts.forEach((themePart) => {
      this.colorService.registerColors(themePart.getColorDefinitions());
    });

    this.colorService.registerWindow(window);
    if (this.themeService.defaultTheme.type === 'dark') {
      this.colorService.setDarkTheme();
    }
    else {
      this.colorService.setLightTheme();
    }

    this.themeService.initialized.then(() => {
      this.colorService.update();
    });
  }
}
