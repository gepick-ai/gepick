import { Module, ServiceModule } from '@gepick/core/common';
import { Application } from './application';
import { ApplicationStateService } from './application-state';
import { CommonApplicationContribution, CommonMenusContribution } from './common-application-contribution';
import { ColorApplicationContribution } from './color-application-contribution';
import { StylingApplicationContribution } from './styling-application-contribution';

@Module({
  services: [
    Application,
    ApplicationStateService,
    CommonApplicationContribution,
    CommonMenusContribution,
    ColorApplicationContribution,
    StylingApplicationContribution,
  ],
})
export class ApplicationModule extends ServiceModule {}
