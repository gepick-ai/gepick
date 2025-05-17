import { Module, ServiceModule } from '@gepick/core/common';
import { QuickViewService } from './quick-view-service';
import { QuickPickServiceImpl } from './quick-pick-service-impl';
import { QuickInputFrontendContribution } from './quick-input-frontend-contribution';
import { QuickHelpService } from './quick-help-service';
import { QuickCommandService } from './quick-command-service';

@Module({
  services: [
    QuickPickServiceImpl,
    QuickViewService,
    QuickInputFrontendContribution,
    QuickHelpService,
    QuickCommandService
  ],
})
export class QuickInputModule extends ServiceModule {}
