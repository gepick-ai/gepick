import "reflect-metadata";

import { CommonMenuModule, CommonModule, ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ContextMenuModule, PluginPreferencesModule, PreferencesModule, ShellModule, TestApplicationModule, ThemePreferencesModule, TreePreferencesModule, WidgetModule } from "@gepick/core/browser";
import { PluginSystemModule } from "@gepick/plugin-system/browser";
import { PluginRegistryModule } from "@gepick/plugin-registry/browser";
import { PreferencesContributionModule, PreferencesViewModule } from "@gepick/preferences/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";

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
    PreferencesModule,
    TestApplicationModule,
    ThemePreferencesModule,
    PluginPreferencesModule,
    PreferencesViewModule,
    PreferencesContributionModule,
    TreePreferencesModule,
    // GettingStartedModule,
  ]);

  resolve(container);
}
catch (err) {
  reject(err);
}
