import { InjectableService, MessagingService, createServiceDecorator } from "@gepick/core/common";
import axios from "axios";

export class NodeMessagingService extends MessagingService {
  constructor() {
    super({ baseURL: "" });
  }

  override onResponseError(errStatus?: number): void {
    // eslint-disable-next-line no-console
    console.log("errStatus", errStatus);
  }
}

export const nodeMessagingService = new NodeMessagingService();

export const INodeRequestService = createServiceDecorator("NodeRequestService");
export interface INodeRequestService {
  request: NodeMessagingService;
}

export class NodeRequestService extends InjectableService implements INodeRequestService {
  public readonly request = nodeMessagingService;
}
