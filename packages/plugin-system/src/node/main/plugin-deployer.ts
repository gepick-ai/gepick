import { Contribution, InjectableService } from '@gepick/core/common';
import { ApplicationContribution, IApplicationContribution } from '@gepick/core/node';
import { IPluginResolver, IPluginServer } from '@gepick/plugin-system/common';
import { GithubPluginResolver } from './plugin-resolvers/github-plugin-resolver';

@Contribution(ApplicationContribution)
export class PluginDeployer extends InjectableService implements IApplicationContribution {
  private pluginResolvers: IPluginResolver[] = [
    new GithubPluginResolver(),
  ];

  private pluginEntries: string[] = ["plugin-a"];

  constructor(
    @IPluginServer private readonly pluginServer: IPluginServer,
  ) {
    super()
  }

  onApplicationInit() {
    this.startDeployment()
  }

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
