import "reflect-metadata";

import { CommonModule, ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ContextMenuModule, ShellModule, TreeModule, WidgetModule } from "@gepick/core/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";
import { PluginSystemModule } from "@gepick/plugin-system/browser";
import { PluginRegistryModule } from "@gepick/plugin-registry/browser";

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([
    CommonModule,
    ApplicationModule,
    WidgetModule,
    ShellModule,
    ContextMenuModule,
    TreeModule,
    PluginSystemModule,
    PluginRegistryModule,
    GettingStartedModule,
  ]);

  resolve(container);
}
catch (err) {
  reject(err);
}
