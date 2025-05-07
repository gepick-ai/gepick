import "reflect-metadata";

import { CommonMenuModule, CommonModule, ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ContextMenuModule, PreferencesModule, ShellModule, ThemeModule, TreePreferencesModule, WidgetModule } from "@gepick/core/browser";
import { PluginSystemModule } from "@gepick/plugin-system/browser";
import { PluginRegistryModule } from "@gepick/plugin-registry/browser";
import { PreferencesContributionModule, PreferencesViewModule } from "@gepick/preferences/browser";

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
