import { webSocketConnectionProvider } from "@gepick/core/browser/messaging/messaging-frontend";
import { createServiceDecorator } from "@gepick/core/common";
import { IRpcService, RpcService } from "../common";
import { HostedPluginWatcher } from "./hosted-plugin-watcher";

export const IMainThreadRpcService = createServiceDecorator<IMainThreadRpcService>("MainThreadRpcService")
export interface IMainThreadRpcService extends IRpcService {
  pluginHostManager: any
}

export class MainThreadRpcService extends RpcService {
  private readonly hostedPluginWatcher = new HostedPluginWatcher()
  public readonly pluginHostManager = webSocketConnectionProvider.createProxy<any>('/services/plugin', this.hostedPluginWatcher.getHostedPluginClient())

  protected override sendMessage(message: any): void {
    this.pluginHostManager.onMessage(JSON.stringify(message))
  }

  override listenMessage() {
    this.hostedPluginWatcher.onPostMessageEvent((message) => {
      this.triggerLocalService(message)
    })
  }
}
