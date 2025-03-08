import { createContributionsDecorator } from '@gepick/core/common';

export const ApplicationContribution = Symbol.for("ApplicationContribution");
export const IApplicationContributions = createContributionsDecorator<IApplicationContribution[]>(ApplicationContribution);

export interface IApplicationContribution {
  onStart: () => void
}
