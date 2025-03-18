import { ServiceContainer } from "@gepick/core/common";
import { IPluginClient } from "@gepick/plugin-system/browser"

export class PluginContribution {
  constructor(public readonly container: ServiceContainer) {}

  onStart(): void {
    const hostedPluginService = this.container.get<IPluginClient>(IPluginClient)
    hostedPluginService.loadPlugins();
  }
}
