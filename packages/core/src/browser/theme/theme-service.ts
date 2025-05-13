import { Deferred, Emitter, Event, IDisposable, InjectableService, PostConstruct, createServiceDecorator, lodashDebounce, toDisposable } from "@gepick/core/common";
import { IPreferencesService } from "../preferences";
import { IPreferenceSchemaProvider } from "../preferences/preference-schema-provider";
import { Theme, ThemeChangeEvent } from "./theme-types";

const COLOR_THEME_PREFERENCE_KEY = 'workbench.colorTheme';
const NO_THEME = { id: 'no-theme', label: 'Not a real theme.', type: 'dark' } as const;

export type DefaultTheme = string | Readonly<{ light: string; dark: string }>;
export namespace DefaultTheme {
  export function defaultForOSTheme(theme: DefaultTheme): string {
    if (typeof theme === 'string') {
      return theme;
    }
    if (
      typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return theme.dark;
    }
    return theme.light;
  }
  export function defaultBackgroundColor(dark?: boolean): string {
    // The default light background color is based on the `colors#editor.background` value from
    // `packages/monaco/data/monaco-themes/vscode/dark_vs.json` and the dark background comes from the `light_vs.json`.
    return dark ? '#1E1E1E' : '#FFFFFF';
  }
}
export class ThemeService extends InjectableService {
  static readonly STORAGE_KEY = 'theme';

  protected themes: { [id: string]: Theme } = {};
  protected activeTheme: Theme = NO_THEME;
  protected readonly deferredInitializer = new Deferred();

  protected readonly themeChange = new Emitter<ThemeChangeEvent>();
  readonly onDidColorThemeChange: Event<ThemeChangeEvent> = this.themeChange.event;

  constructor(
    @IPreferencesService protected readonly preferences: IPreferencesService,
    @IPreferenceSchemaProvider protected readonly schemaProvider: IPreferenceSchemaProvider,
  ) {
    super();
  }

  get initialized(): Promise<void> {
    return this.deferredInitializer.promise;
  }

  @PostConstruct()
  protected init(): void {
    this.register(...BuiltinThemeProvider.themes);
    this.loadUserTheme();
    this.preferences.ready.then(() => {
      this.validateActiveTheme();
      this.updateColorThemePreference();
      this.preferences.onPreferencesChanged((changes) => {
        if (COLOR_THEME_PREFERENCE_KEY in changes) {
          this.validateActiveTheme();
        }
      });
    });
  }

  register(...themes: Theme[]): IDisposable {
    for (const theme of themes) {
      this.themes[theme.id] = theme;
    }
    this.validateActiveTheme();
    this.updateColorThemePreference();
    return toDisposable(() => {
      for (const theme of themes) {
        delete this.themes[theme.id];
        if (this.activeTheme === theme) {
          this.setCurrentTheme(this.defaultTheme.id, false);
        }
      }
      this.updateColorThemePreference();
    });
  }

  protected validateActiveTheme(): void {
    if (this.preferences.isReady) {
      const configuredTheme = this.getConfiguredTheme();
      if (configuredTheme && configuredTheme !== this.activeTheme) {
        this.setCurrentTheme(configuredTheme.id, false);
      }
    }
  }

  protected updateColorThemePreference = lodashDebounce(() => this.doUpdateColorThemePreference(), 500);

  protected doUpdateColorThemePreference(): void {
    const preference = this.schemaProvider.getSchemaProperty(COLOR_THEME_PREFERENCE_KEY);
    if (preference) {
      const sortedThemes = this.getThemes().sort((a, b) => a.label.localeCompare(b.label));
      this.schemaProvider.updateSchemaProperty(COLOR_THEME_PREFERENCE_KEY, {
        ...preference,
        enum: sortedThemes.map(e => e.id),
        enumItemLabels: sortedThemes.map(e => e.label),
      });
    }
  }

  getThemes(): Theme[] {
    const result = [];
    for (const o in this.themes) {
      if (this.themes.hasOwnProperty(o)) {
        result.push(this.themes[o]);
      }
    }
    return result;
  }

  getTheme(themeId: string): Theme {
    return this.themes[themeId] || this.defaultTheme;
  }

  protected tryGetTheme(themeId: string): Theme | undefined {
    return this.themes[themeId];
  }

  /** Should only be called at startup. */
  loadUserTheme(): void {
    const storedThemeId = window.localStorage.getItem(ThemeService.STORAGE_KEY) ?? this.defaultTheme.id;
    const theme = this.getTheme(storedThemeId);
    this.setCurrentTheme(theme.id, false);
    this.deferredInitializer.resolve();
  }

  /**
   * @param persist If `true`, the value of the `workbench.colorTheme` preference will be set to the provided ID.
   */
  setCurrentTheme(themeId: string, persist = true): void {
    const newTheme = this.tryGetTheme(themeId);
    const oldTheme = this.activeTheme;
    if (newTheme && newTheme !== oldTheme) {
      oldTheme?.deactivate?.();
      newTheme.activate?.();
      this.activeTheme = newTheme;
      this.themeChange.fire({ newTheme, oldTheme });
    }
    if (persist) {
      this.preferences.updateValue(COLOR_THEME_PREFERENCE_KEY, themeId);
    }
  }

  getCurrentTheme(): Theme {
    return this.activeTheme;
  }

  protected getConfiguredTheme(): Theme | undefined {
    const configuredId = this.preferences.get<string>(COLOR_THEME_PREFERENCE_KEY);
    return configuredId ? this.themes[configuredId.toString()] : undefined;
  }

  /**
   * The default theme. If that is not applicable, returns with the fallback theme.
   */
  get defaultTheme(): Theme {
    return this.tryGetTheme(DefaultTheme.defaultForOSTheme('dark'))
      ?? this.getTheme(DefaultTheme.defaultForOSTheme('dark'));
  }

  /**
   * Resets the state to the user's default, or to the fallback theme. Also discards any persisted state in the local storage.
   */
  reset(): void {
    this.setCurrentTheme(this.defaultTheme.id);
  }
}

export const IThemeService = createServiceDecorator<IThemeService>(ThemeService.name);
export type IThemeService = ThemeService;

export class BuiltinThemeProvider {
  static readonly darkTheme: Theme = {
    id: 'dark',
    type: 'dark',
    label: 'Dark (Theia)',
    editorTheme: 'dark-theia', // loaded in /packages/monaco/src/browser/textmate/monaco-theme-registry.ts
  };

  static readonly lightTheme: Theme = {
    id: 'light',
    type: 'light',
    label: 'Light (Theia)',
    editorTheme: 'light-theia', // loaded in /packages/monaco/src/browser/textmate/monaco-theme-registry.ts
  };

  static readonly hcTheme: Theme = {
    id: 'hc-theia',
    type: 'hc',
    label: 'High Contrast (Theia)',
    editorTheme: 'hc-theia', // loaded in /packages/monaco/src/browser/textmate/monaco-theme-registry.ts
  };

  static readonly hcLightTheme: Theme = {
    id: 'hc-theia-light',
    type: 'hcLight',
    label: 'High Contrast Light (Theia)',
    editorTheme: 'hc-theia-light', // loaded in /packages/monaco/src/browser/textmate/monaco-theme-registry.ts
  };

  static readonly themes = [
    BuiltinThemeProvider.darkTheme,
    BuiltinThemeProvider.lightTheme,
    BuiltinThemeProvider.hcTheme,
    BuiltinThemeProvider.hcLightTheme,
  ];
}
