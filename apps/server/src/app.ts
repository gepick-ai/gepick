import "reflect-metadata";

import { ServiceContainer } from '@gepick/core/common';
import { ApplicationModule, FileModule, MessagingModule, RequestModule } from "@gepick/core/node";
import { PluginMainModule } from '@gepick/plugin-system/node';

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>();

try {
  const container = new ServiceContainer([
    ApplicationModule,
    MessagingModule,
    FileModule,
    RequestModule,
    PluginMainModule,
  ]);
  resolve(container);
}
catch (err) {
  reject(err);
}
