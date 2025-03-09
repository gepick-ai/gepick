import { Module, ServiceModule } from '@gepick/core/common';
import { Application } from './application';

@Module({
  services: [
    Application,
  ],
})
export class ApplicationModule extends ServiceModule {}
