import "reflect-metadata";

import { CommonMenuModule, CommonModule, ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ContextMenuModule, FrontendApplicationConfigProvider, PreferencesModule, ShellModule, ThemeModule, TreePreferencesModule, WidgetModule } from "@gepick/core/browser";
import { PluginSystemModule } from "@gepick/plugin-system/browser";
import { PluginRegistryModule } from "@gepick/plugin-registry/browser";
import { PreferencesContributionModule, PreferencesViewModule } from "@gepick/preferences/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";

FrontendApplicationConfigProvider.set({
  applicationName: "Theia Browser Example",
  defaultTheme: {
    light: "light",
    dark: "dark",
  },
  defaultIconTheme: "theia-file-icons",
  electron: {
    windowOptions: {},
    showWindowEarly: true,
    splashScreenOptions: {},
    uriScheme: "theia",
  },
  defaultLocale: "",
  validatePreferencesSchema: true,
  reloadOnReconnect: true,
  uriScheme: "theia",
  preferences: {
    "files.enableTrash": false,
    "security.workspace.trust.enabled": false,
  },
});

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([
    CommonModule,
    CommonMenuModule,
    ApplicationModule,
    WidgetModule,
    ShellModule,
    ThemeModule,
    ContextMenuModule,
    PluginSystemModule,
    GettingStartedModule,
    PluginRegistryModule,
    PreferencesModule,
    PreferencesViewModule,
    PreferencesContributionModule,
    TreePreferencesModule,
  ]);

  resolve(container);
}
catch (err) {
  reject(err);
}
