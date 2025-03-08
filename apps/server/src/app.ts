import "reflect-metadata";

import { ServiceContainer } from '@gepick/core/common';
import { MessagingModule } from "@gepick/core/node";

export const { promise, resolve, reject } = Promise.withResolvers<ServiceContainer>()

try {
  const container = new ServiceContainer([
    MessagingModule,
  ])
  resolve(container)
}
catch (err) {
  reject(err)
}
