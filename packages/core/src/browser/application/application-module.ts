import { Module, ServiceModule } from '@gepick/core/common';
import { Application } from './application';
import { ApplicationStateService } from './application-state';
import { CommonApplicationContribution } from './common-application-contribution';

@Module({
  services: [
    Application,
    ApplicationStateService,
    CommonApplicationContribution,
  ],
})
export class ApplicationModule extends ServiceModule {}
