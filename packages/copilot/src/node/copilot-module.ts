import { Module, ServiceModule } from '@gepick/core/common';
import { CopilotController } from './copilot-controller';
import { CopilotService } from './copilot-service';

@Module({
  services: [
    CopilotController,
    CopilotService,
  ],
})
export class CopilotModule extends ServiceModule {
  constructor() {
    super();
  }
}
