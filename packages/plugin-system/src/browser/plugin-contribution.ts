import { HostedPlugin } from "./hosted-plugin"

export class PluginContribution {
  onStart(): void {
    const hostedPlugin = new HostedPlugin();

    hostedPlugin.loadPlugins()
  }
}

export const pluginContribution = new PluginContribution();
