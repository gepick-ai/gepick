import "reflect-metadata";

import { ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ApplicationShellModule, ExtensionModule, SearchModule, TreeModule } from "@gepick/core/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([
    ApplicationModule,
    ApplicationShellModule,
    TreeModule,
    SearchModule,
    ExtensionModule,
    GettingStartedModule,
  ]);

  resolve(container);
}
catch (err) {
  reject(err);
}
