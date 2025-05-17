import { ApplicationContribution } from '../application';
import { IQuickAccessContributionProvider } from './quick-access';

export class QuickInputFrontendContribution extends ApplicationContribution {
  @IQuickAccessContributionProvider protected readonly contributionProvider: IQuickAccessContributionProvider;

  override onApplicationStart(): void {
    this.contributionProvider.getContributions().forEach((contrib) => {
      contrib.registerQuickAccessProvider();
    });
  }
}
