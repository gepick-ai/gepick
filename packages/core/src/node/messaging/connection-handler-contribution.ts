import { IConnectionHandler, createContribution } from '@gepick/core/common';

export const [IConnectionHandlerContribution, IConnectionHandlerProvider] = createContribution<IConnectionHandlerContribution>('ConnectionHandlerContribution');
export interface IConnectionHandlerContribution {
  createConnectionHandler?: () => IConnectionHandler;
}
