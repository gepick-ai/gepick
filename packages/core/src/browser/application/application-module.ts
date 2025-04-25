import { Module, ServiceModule } from '@gepick/core/common';
import { Application } from './application';
import { ApplicationStateService } from './application-state';

@Module({
  services: [
    Application,
    ApplicationStateService,
  ],
})
export class ApplicationModule extends ServiceModule {}
