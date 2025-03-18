import { webSocketConnectionProvider } from "@gepick/core/browser/messaging/messaging-frontend";
import { createServiceDecorator } from "@gepick/core/common";
import { IRpcService, RpcService } from "../common";

export const IMainThreadRpcService = createServiceDecorator<IMainThreadRpcService>("MainThreadRpcService")
export interface IMainThreadRpcService extends IRpcService {
  pluginService: any
}

/**
 * - 需要发送给plugin host各种ext服务的请求时，直接通过MainThreadRpcService.getRemoteServiceProxy(PluginHostContext.CommandRegistryExt)来获取服务代理。
 * - 需要发送给plugin server main的对应服务请求时，就需要通过MainThreadRpcService.pluginHostManager来获取pluginHostManager的服务代理。
 *
 * 上面两种调用方式的区别方式是：搞清楚你是想要发消息给plugin host还是plugin server main。plugin host就是插件所运行的宿主环境，而plugin server main就是server主代码运行的宿主环境。
 */
export class MainThreadRpcService extends RpcService {
  public readonly pluginService = webSocketConnectionProvider.createProxy<any>('/services/plugin', this)

  protected override sendMessage(message: any): void {
    this.pluginService.sendMessage(JSON.stringify(message))
  }

  override listenMessage(message?: string) {
    if (message) {
      this.triggerLocalService(message)
    }

    return Promise.resolve()
  }
}
