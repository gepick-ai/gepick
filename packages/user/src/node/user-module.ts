import { Module, ServiceModule } from '@gepick/core/common';
import { UserController } from './user-controller';
import { QuotaService, UserService } from './user-service';

@Module({
  services: [
    UserController,
    UserService,
    QuotaService,
  ],
})
export class UserModule extends ServiceModule {}
