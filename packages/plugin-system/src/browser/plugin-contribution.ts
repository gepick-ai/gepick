import { ServiceContainer } from "@gepick/core/common";
import { IHostedPluginService } from "./hosted-plugin"
import { IMainThreadRpcService } from "./main-thread-rpc";

export class PluginContribution {
  constructor(public readonly container: ServiceContainer) {

  }

  onStart(): void {
    const mainThreadRpcService = this.container.get<IMainThreadRpcService>(IMainThreadRpcService)
    mainThreadRpcService.listenMessage()

    const hostedPluginService = this.container.get<IHostedPluginService>(IHostedPluginService)
    hostedPluginService.loadPlugins();
  }
}
