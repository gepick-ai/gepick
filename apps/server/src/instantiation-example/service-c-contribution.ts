import { createContributionProviderDecorator } from '@gepick/core/common';

export const [ApplicationContribution, IApplicationContributionProvider] = createContributionProviderDecorator<IApplicationContribution[]>("ApplicationContribution");

export interface IApplicationContribution {
  onStart: () => void
}
