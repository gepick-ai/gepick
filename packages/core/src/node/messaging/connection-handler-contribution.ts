import { ConnectionHandler, createContributionProviderDecorator } from '@gepick/core/common';

export const [ConnectionHandlerContribution, IConnectionHandlerContributionProvider] = createContributionProviderDecorator<IConnectionHandlerContribution>('ConnectionHandlerContribution')
export interface IConnectionHandlerContribution {
  onConnectionHandlerConfigure?: () => ConnectionHandler
}
