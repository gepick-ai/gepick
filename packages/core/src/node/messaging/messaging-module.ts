import { Module, ServiceModule } from "@gepick/core/common";
import { MessagingService } from './messaging-service';

@Module({
  services: [
    MessagingService,
  ],
})
export class MessagingModule extends ServiceModule {}
