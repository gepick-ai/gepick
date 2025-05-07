import { DisposableCollection, Emitter, toDisposable } from "@gepick/core/common";
import { IColorRegistry, IThemePartProvider, IThemeService } from "../theme";
import { ApplicationContribution } from "./application-contribution";

export class ColorApplicationContribution extends ApplicationContribution {
  protected readonly _onDidChange = new Emitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  protected readonly toUpdate = new DisposableCollection();
  private readonly windows: Set<Window> = new Set();

  constructor(
    @IColorRegistry protected readonly colorRegistry: IColorRegistry,
    @IThemePartProvider protected readonly themePartProvider: IThemePartProvider,
    @IThemeService protected readonly themeService: IThemeService,
  ) {
    super();
  }

  override onApplicationStart() {
    const themeParts = this.themePartProvider.getContributions();

    themeParts.forEach((themePart) => {
      this.colorRegistry.register(...themePart.getColorDefinitions());
    });

    this.colorRegistry.onDidChange(() => this.update());

    this.registerWindow(window);
  }

  protected update(): void {
    this.toUpdate.dispose();
    this.windows.forEach(win => this.updateWindow(win));
    this._onDidChange.fire();
  }

  registerWindow(win: Window): void {
    this.windows.add(win);
    this.updateWindow(win);
    this._onDidChange.fire();
  }

  protected updateWindow(win: Window): void {
    const theme = `theia-${this.themeService.getCurrentTheme().type}`;

    win.document.body.classList.add(theme);
    this.toUpdate.push(toDisposable(() => win.document.body.classList.remove(theme)));

    const documentElement = win.document.documentElement;
    if (documentElement) {
      const colors = Array.from(this.colorRegistry.getColors());

      for (const id of colors) {
        const variable = this.colorRegistry.getCurrentCssVariable(id);
        if (variable) {
          const { name, value } = variable;
          documentElement.style.setProperty(name, value);
          this.toUpdate.push(toDisposable(() => documentElement.style.removeProperty(name)));
        }
      }
    }
  }

  protected updateThemeBackground(): void {
    const color = this.colorRegistry.getCurrentColor('editor.background');
    if (color) {
      window.localStorage.setItem('theme.background', color);
    }
    else {
      window.localStorage.removeItem('theme.background');
    }
  }
}
