import { Module, ServiceModule } from "@gepick/core/common";
import { NodeRequestService } from "./node-messaging";

@Module({
  services: [
    NodeRequestService,
  ],
})
export class RequestModule extends ServiceModule {}
