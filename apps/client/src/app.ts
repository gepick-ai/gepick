import "reflect-metadata";

import { CommonMenuModule, CommonModule, ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ContextMenuModule, PluginPreferencesModule, PreferencesModule, ShellModule, TestApplicationModule, ThemePreferencesModule, WidgetModule } from "@gepick/core/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";
import { PluginSystemModule } from "@gepick/plugin-system/browser";
import { PluginRegistryModule } from "@gepick/plugin-registry/browser";
import { PreferencesViewModule } from "@gepick/preferences/browser";

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([
    CommonModule,
    CommonMenuModule,
    ApplicationModule,
    WidgetModule,
    ShellModule,
    ContextMenuModule,
    PluginSystemModule,
    PluginRegistryModule,
    GettingStartedModule,
    PreferencesModule,
    TestApplicationModule,
    ThemePreferencesModule,
    PluginPreferencesModule,
    PreferencesViewModule,
  ]);

  resolve(container);
}
catch (err) {
  reject(err);
}
