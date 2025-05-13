export type RequiredRecursive<T> = {
  [K in keyof T]-?: T[K] extends object ? RequiredRecursive<T[K]> : T[K]
};

/**
 * Base configuration for the Theia application.
 */
export interface ApplicationConfig {
  readonly [key: string]: any;
}

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

/**
 * Application configuration for the frontend. The following properties will be injected into the `index.html`.
 */
export type FrontendApplicationConfig = RequiredRecursive<FrontendApplicationConfig.Partial>;
export namespace FrontendApplicationConfig {
  export const DEFAULT: FrontendApplicationConfig = {
    applicationName: 'Eclipse Theia',
    defaultTheme: { light: 'light', dark: 'dark' },
    defaultIconTheme: 'theia-file-icons',
    defaultLocale: '',
    validatePreferencesSchema: true,
    reloadOnReconnect: false,
    uriScheme: 'theia',
  };
  export interface Partial extends ApplicationConfig {

    /**
         * The default theme for the application.
         *
         * Defaults to `dark` if the OS's theme is dark. Otherwise `light`.
         */
    readonly defaultTheme?: DefaultTheme;

    /**
         * The default icon theme for the application.
         *
         * Defaults to `none`.
         */
    readonly defaultIconTheme?: string;

    /**
         * The name of the application.
         *
         * Defaults to `Eclipse Theia`.
         */
    readonly applicationName?: string;

    /**
         * The default locale for the application.
         *
         * Defaults to "".
         */
    readonly defaultLocale?: string;

    /**
         * When `true`, the application will validate the JSON schema of the preferences on start
         * and log warnings to the console if the schema is not valid.
         *
         * Defaults to `true`.
         */
    readonly validatePreferencesSchema?: boolean;

    /**
         * When 'true', the window will reload in case the front end reconnects to a back-end,
         * but the back end does not have a connection context for this front end anymore.
         */
    readonly reloadOnReconnect?: boolean;
  }
}

export interface NpmRegistryProps {

  /**
     * Defaults to `false`.
     */
  readonly next: boolean;

  /**
     * Defaults to `https://registry.npmjs.org/`.
     */
  readonly registry: string;

}
export namespace NpmRegistryProps {
  export const DEFAULT: NpmRegistryProps = {
    next: false,
    registry: 'https://registry.npmjs.org/',
  };
}

/**
 * Representation of all backend and frontend related Theia extension and application properties.
 */
export interface ApplicationProps extends NpmRegistryProps {
  readonly [key: string]: any;

  /**
     * Whether the extension targets the browser or electron. Defaults to `browser`.
     */
  readonly target: ApplicationProps.Target;

  /**
     * Frontend related properties.
     */
  readonly frontend: {
    readonly config: FrontendApplicationConfig;
  };
}
export namespace ApplicationProps {
  export type Target = `${ApplicationTarget}`;
  export enum ApplicationTarget {
    browser = 'browser',
    electron = 'electron',
    browserOnly = 'browser-only',
  };
  export const DEFAULT: ApplicationProps = {
    ...NpmRegistryProps.DEFAULT,
    target: 'browser',
    frontend: {
      config: FrontendApplicationConfig.DEFAULT,
    },
  };

}
