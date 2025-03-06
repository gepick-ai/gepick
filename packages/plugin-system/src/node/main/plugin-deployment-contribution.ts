import { PluginDeploymentService } from '@gepick/plugin-system/node';

export class PluginDeploymentContribution {
  private pluginDeploymentService = new PluginDeploymentService();

  initialize() {
    this.pluginDeploymentService.startDeployment();
  }
}

export const pluginDeploymentContribution = new PluginDeploymentContribution();
