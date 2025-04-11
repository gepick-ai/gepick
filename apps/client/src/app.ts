import "reflect-metadata";

import { ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, ApplicationShellModule, ExtensionModule, SearchModule } from "@gepick/core/browser";
import { GettingStartedModule } from "@gepick/getting-started/browser";

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([ApplicationModule, ApplicationShellModule, SearchModule, ExtensionModule, GettingStartedModule]);

  resolve(container);
}
catch (err) {
  reject(err);
}
