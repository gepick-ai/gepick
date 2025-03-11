import { IConnectionHandler, createContributionProviderDecorator } from '@gepick/core/common';

export const [ConnectionHandlerContribution, IConnectionHandlerProvider] = createContributionProviderDecorator<IConnectionHandlerContribution>('ConnectionHandlerContribution')
export interface IConnectionHandlerContribution {
  createConnectionHandler?: () => IConnectionHandler
}
