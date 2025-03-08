import { Module, ServiceModule } from "@gepick/core/common";
import { MessagingContribution } from './messaging-contribution';

@Module({
  services: [
    MessagingContribution,
  ],
})
export class MessagingModule extends ServiceModule {}
