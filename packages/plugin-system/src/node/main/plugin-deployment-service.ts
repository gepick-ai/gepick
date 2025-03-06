import { IPluginResolver } from '@gepick/plugin-system/common';
import { GithubPluginResolver, pluginServer } from '@gepick/plugin-system/node';

export class PluginDeploymentService {
  private pluginResolvers: IPluginResolver[] = [
    new GithubPluginResolver(),
  ];

  private pluginEntries: string[] = ["plugin-a"];
  private pluginServer = pluginServer;

  startDeployment() {
    // this.resolvePlugins(['plugin-a']);
    // this.processPlugins();
    this.deployPlugins();
  }

  resolvePlugins(pluginIds: string[]) {
    pluginIds.forEach((id) => {
      try {
        const pluginResolver = this.pluginResolvers.find(resolver => resolver.accept(id))

        if (!pluginResolver) {
          throw new Error(`No resolver found for plugin id: ${id}`);
        }

        pluginResolver.resolve(id as any);

        this.pluginEntries.push(id);
      }
      catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
    })
  }

  processPlugins() {
    // eslint-disable-next-line no-console
    console.log('processPlugins');
  }

  deployPlugins() {
    this.pluginServer.deployPlugins(this.pluginEntries);
  }
}
