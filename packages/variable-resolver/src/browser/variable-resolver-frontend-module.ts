import { Module, ServiceModule } from '@gepick/core/common';
import { VariableRegistry } from './variable';
import { VariableQuickOpenService } from './variable-quick-open-service';
import { VariableResolverFrontendContribution } from './variable-resolver-frontend-contribution';
import { VariableResolverService } from './variable-resolver-service';
import { CommonVariableContribution } from './common-variable-contribution';

@Module({
  services: [
    VariableRegistry,
    VariableResolverService,
    VariableQuickOpenService,
    CommonVariableContribution,
    VariableResolverFrontendContribution,
  ],
})
export class VariableResolverModule extends ServiceModule {}
