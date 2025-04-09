import "reflect-metadata";

import { ServiceContainer } from "@gepick/core/common";
import { ApplicationModule, SearchModule } from "@gepick/core/browser";

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([ApplicationModule, SearchModule]);

  resolve(container);
}
catch (err) {
  reject(err);
}
