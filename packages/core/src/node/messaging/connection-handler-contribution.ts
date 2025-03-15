import { IConnectionHandler, createContribution } from '@gepick/core/common';

export const [ConnectionHandlerContribution, IConnectionHandlerProvider] = createContribution<IConnectionHandlerContribution>('ConnectionHandlerContribution')
export interface IConnectionHandlerContribution {
  createConnectionHandler?: () => IConnectionHandler
}
