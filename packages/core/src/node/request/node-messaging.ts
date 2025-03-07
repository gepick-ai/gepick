import { MessagingService } from "@gepick/core/common";

export class NodeMessagingService extends MessagingService {
  constructor() {
    super({ baseURL: "" });
  }

  override onResponseError(errStatus?: number): void {
    // eslint-disable-next-line no-console
    console.log("errStatus", errStatus)
  }
}

export const nodeMessagingService = new NodeMessagingService();
