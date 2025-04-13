import "reflect-metadata";

import { CommonModule, ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ContextMenuModule, SearchModule, ShellModule, TreeModule } from "@gepick/core/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";
import { PluginRegistryModule } from "@gepick/plugin-registry/browser";

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([
    CommonModule,
    ApplicationModule,
    ShellModule,
    ContextMenuModule,
    TreeModule,
    SearchModule,
    PluginRegistryModule,
    GettingStartedModule,
  ]);

  resolve(container);
}
catch (err) {
  reject(err);
}
