import { ColorDefinition, DisposableCollection, Emitter, InjectableService, PostConstruct, createServiceDecorator, toDisposable } from "@gepick/core/common";
import { IColorRegistry } from "./color-registry";
import { IThemeService } from "./theme-service";

export class ColorService extends InjectableService {
  protected readonly _onDidChange = new Emitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  protected readonly toUpdate = new DisposableCollection();
  private readonly windows: Set<Window> = new Set();

  constructor(
    @IColorRegistry protected readonly colorRegistry: IColorRegistry,
    @IThemeService protected readonly themeService: IThemeService,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.themeService.onDidColorThemeChange(() => {
      this.update();
      this.updateThemeBackground();
    });
    this.colorRegistry.onDidChange(() => this.update());
  }

  update(): void {
    this.toUpdate.dispose();
    this.windows.forEach(win => this.updateWindow(win));
    this._onDidChange.fire();
  }

  registerColors(colorDefinitions: ColorDefinition[]): void {
    this.colorRegistry.register(...colorDefinitions);
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

  setDarkTheme(): void {
    this.colorRegistry.setDarkTheme();
  }

  setLightTheme(): void {
    this.colorRegistry.setLightTheme();
  }
}

export const IColorService = createServiceDecorator<IColorService>(ColorService.name);
export type IColorService = ColorService;
