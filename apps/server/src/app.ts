import "reflect-metadata";

import { ServiceContainer } from '@gepick/core/common';
import { ApplicationModule, MessagingModule } from "@gepick/core/node"
import { CopilotModule } from "@gepick/copilot/node"
import { UserModule } from '@gepick/user/node';
import { AuthModule } from '@gepick/auth/node';

export const { promise: moduleLoadReady, resolve, reject } = Promise.withResolvers<ServiceContainer>()

try {
  const container = new ServiceContainer([
    ApplicationModule,
    // MessagingModule,
    CopilotModule,
    UserModule,
    AuthModule,
  ])
  resolve(container)
}
catch (err) {
  reject(err)
}
