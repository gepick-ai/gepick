import { ServiceContainer } from "@gepick/core/common";
import { IHostedPluginService } from "./hosted-plugin"
import { PluginBrowserModule } from "./plugin-browser-module";
import { IMainThreadRpcService } from "./main-thread-rpc";

const container = new ServiceContainer([PluginBrowserModule])

export class PluginContribution {
  onStart(): void {
    const mainThreadRpcService = container.get<IMainThreadRpcService>(IMainThreadRpcService)
    mainThreadRpcService.listenMessage()

    const hostedPluginService = container.get<IHostedPluginService>(IHostedPluginService)
    hostedPluginService.loadPlugins();
  }
}

export const pluginContribution = new PluginContribution();
