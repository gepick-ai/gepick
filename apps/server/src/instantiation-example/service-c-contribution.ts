import { createContribution } from '@gepick/core/common';

export const [ApplicationContribution, IApplicationContributionProvider] = createContribution<IApplicationContribution[]>("ApplicationContribution");

export interface IApplicationContribution {
  onStart: () => void
}
