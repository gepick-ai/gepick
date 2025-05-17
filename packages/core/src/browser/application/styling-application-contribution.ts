import { DecorationStyle } from "../services";
import { ColorTheme, CssStyleCollector, IStylingParticipantProvider } from "../theme/styling-contribution";
import { IColorRegistry } from "../theme/color-registry";
import { IThemeService } from "../theme/theme-service";
import { Theme } from "../theme/theme-types";
import { ApplicationContribution } from ".";

export class StylingApplicationContribution extends ApplicationContribution {
  protected cssElements = new Map<Window, HTMLStyleElement>();

  constructor(
    @IThemeService protected readonly themeService: IThemeService,
    @IColorRegistry protected readonly colorRegistry: IColorRegistry,
    @IStylingParticipantProvider protected readonly themingParticipants: IStylingParticipantProvider,
  ) {
    super();
  }

  override onApplicationStart(): void {
    this.registerWindow(window);

    // TODO: debug theme change
    // this.themeService.onDidColorThemeChange(e => this.applyStylingToWindows(e.newTheme));
  }

  registerWindow(win: Window): void {
    const cssElement = DecorationStyle.createStyleElement('contributedColorTheme', win.document.head);
    this.cssElements.set(win, cssElement);
    this.applyStyling(this.themeService.getCurrentTheme(), cssElement);
  }

  protected applyStylingToWindows(theme: Theme): void {
    this.cssElements.forEach(cssElement => this.applyStyling(theme, cssElement));
  }

  protected applyStyling(theme: Theme, cssElement: HTMLStyleElement): void {
    const rules: string[] = [];
    const colorTheme: ColorTheme = {
      type: theme.type,
      label: theme.label,
      getColor: color => this.colorRegistry.getCurrentColor(color),
    };
    const styleCollector: CssStyleCollector = {
      addRule: rule => rules.push(rule),
    };
    for (const themingParticipant of this.themingParticipants.getContributions()) {
      themingParticipant.registerThemeStyle(colorTheme, styleCollector);
    }
    const fullCss = rules.join('\n');
    cssElement.textContent = fullCss;
  }
}
