import { Module, ServiceModule } from '@gepick/core/common';
import { Application } from './application';
import { ApplicationStateService } from './application-state';
import { CommonApplicationContribution, CommonMenusContribution } from './contributions/common-application-contribution';
import { ColorApplicationContribution } from './contributions/color-application-contribution';
import { StylingApplicationContribution } from './contributions/styling-application-contribution';

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
