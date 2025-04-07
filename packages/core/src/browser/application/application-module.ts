import { Module, ServiceModule } from '@gepick/core/common';
import { ApplicationShell } from '../shell/application-shell';
import { Application } from './application';

@Module({
  services: [
    Application,
    ApplicationShell,
  ],
})
export class ApplicationModule extends ServiceModule {}
