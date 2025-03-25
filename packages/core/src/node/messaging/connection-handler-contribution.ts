import { IConnectionHandler, createContribution, createServiceDecorator } from '@gepick/core/common';

export const [IConnectionHandlerContribution, IConnectionHandlerProvider] = createContribution<IConnectionHandlerContribution>('ConnectionHandlerContribution');
export interface IConnectionHandlerContribution {
  /**
   * 当messagingService需要配置所有的connection handler的时候触发，你可以在这个阶段配置你的json rpc connection handler
   */
  onConfigureConnectionHandler: (messagingService: IMessagingService) => void;
}

export const IMessagingService = createServiceDecorator<IMessagingService>("MessagingService");
export interface IMessagingService {
  addHandler: (handler: IConnectionHandler) => void;
}
