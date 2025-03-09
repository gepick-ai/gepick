import { createContributionsDecorator } from '@gepick/core/common';

export const [ApplicationContribution,IApplicationContributions] = createContributionsDecorator<IApplicationContribution[]>("ApplicationContribution");

export interface IApplicationContribution {
  onStart: () => void
}
