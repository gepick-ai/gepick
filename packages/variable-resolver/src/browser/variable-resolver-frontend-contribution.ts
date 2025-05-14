import { Command, CommandRegistry, InjectableService } from '@gepick/core/common';
import { ApplicationContribution } from '@gepick/core/browser';
import { IVariableContributionProvider, IVariableRegistry } from './variable';
import { IVariableQuickOpenService } from './variable-quick-open-service';

export const LIST_VARIABLES: Command = Command.toLocalizedCommand({
  id: 'variable.list',
  label: 'Variable: List All',
}, 'theia/variableResolver/listAllVariables');

export class VariableResolverFrontendContribution extends InjectableService implements ApplicationContribution {
  constructor(
        @IVariableContributionProvider protected readonly contributionProvider: IVariableContributionProvider,
        @IVariableRegistry protected readonly variableRegistry: IVariableRegistry,
        @IVariableQuickOpenService protected readonly variableQuickOpenService: IVariableQuickOpenService,
  ) {
    super();
  }

  onStart(): void {
    this.contributionProvider.getContributions().forEach(contrib =>
      contrib.registerVariables(this.variableRegistry),
    );
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(LIST_VARIABLES, {
      isEnabled: () => true,
      execute: () => this.variableQuickOpenService.open(),
    });
  }
}
