import { Contribution, IContributionProvider, InjectableService } from '@gepick/core/common';
import { ApplicationContribution, IApplicationContribution } from '@gepick/core/node';
import { IPluginServer } from '../../common/plugin-protocol';
import { IPluginResolverContribution, IPluginResolverProvider } from './plugin-resolver/plugin-resolver-contribution';

// @Contribution(ApplicationContribution)
export class PluginDeployer extends InjectableService implements IApplicationContribution {
  private pluginEntries: string[] = ["plugin-a"];

  constructor(
    @IPluginServer private readonly pluginServer: IPluginServer,
    @IPluginResolverProvider private readonly pluginResolverProvider: IContributionProvider<IPluginResolverContribution>,
  ) {
    super()
  }

  onApplicationInit() {
    this.startDeployment()
  }

  startDeployment() {
    // =====================步骤1: 检测plugin存放位置================
    //  local-dir:../../plugins
    // "local-dir:/Users/work/.gepick/plugins"

    // =====================步骤2: 根据plugin存放位置解析plugin================
    /**
     * 这里的具体做法：
     * 我们将plugin存放位置集合进行遍历，针对每一个plugins存放位置尝试寻找一个能够解析这个位置scheme的resolver。
     * 比如，这里是local-dir:../../plugins，那么会找到的就是LocalDirectoryPluginDeployerResolver，意思是能够利用这个resolver来解析这样scheme的plugins存放位置。
     * 接下来我们创建resolver context，让resolver去解析时拿到它，由于resolver所解析的位置存在不少插件，因此resolver需要不断解析到具体的插件路径后存放到resolver context中。
     * 最终我们将plugin所在位置解析完成后从context将这些插件具体路径存放到plugin entries中，等待部署。
     */
    // this.resolvePlugins(['plugin-a']);
    // ===================步骤3: 根据plugin entries尝试处理每个entry确定plugin类型=============
    /* eslint-disable no-irregular-whitespace */
    /**
     * 下面是一个具体的plugin的结构：
     * ├── [Content_Types].xml
     * ├── extension
     * │   ├── LICENSE.txt
     * │   ├── README.md
     * │   ├── extension.js
     * │   ├── icon128.png
     * │   └── package.json
     * └── extension.vsixmanifest
     *
     * 这个环节的具体做法是拿到package.json对象，根据packageJson.main || !packageJson.browser来判断是一个合理的backend插件。theia里头的做法是需要判断三种类型插件，
     * 我们这里只需要判断是一个backend插件就好了。插件代码存储在extension文件夹中，所以实际的路径处理应该是plugin entry + '/extension'
     */
    // this.processPlugins();
    // ==================步骤4: 拿着plugin entries部署plugin
    /**
     * 具体的做法是：
     * 我们使用plugin reader（其实就是对extension文件夹读取设计的一个结构）读取plugin/extension下的pkgjson。
     * 利用pkgjson和plugin scanner获取plugin metadata。具体的metadta结构设计如下：
     * { host, model, lifecycle, outOfSync }。
     * 最主要的就是model和lifecycle。model主要拿到plugin的entry point，也就是实际执行的插件入口。
     * 最终我们在read metadata阶段拿到该插件的pluginId以及plugin extension path然后将二者放入pluginsIdsFiles（Map between a plugin id and its local storage）字典中存放。
     * 接下来设计一个deployedLocations Set，将plugin的root path放入（即extension文件夹的上一层，就是plugin所在目录）。
     * 紧接着将plugin id和deployedLocations Set关联在一块。意图大致是能够通过plugin id知道plugin对应的所有部署位置。
     * 接下来设计一个新的结构叫做DeployedPlugin，表示该plugin已经部署，即代表一次plugin部署完成。
     * DeployedPlugin结构设计如下： { pluginMetadata： plugin的元数据, type：用户插件还是系统插件, contributes: 一个plugin pkgjson中定义的扩展core的扩展点 }
     * 完成一次plugin部署后，将这次部署加入this.deployedPlugins。
     * 完成上述所有的操作之后，标记plugin id已经是下载部署完成了this.markAsInstalled(id)
     */
    this.deployPlugins();
  }

  resolvePlugins(pluginIds: string[]) {
    pluginIds.forEach((id) => {
      try {
        const resolvers = this.pluginResolverProvider.getContributions()
        const pluginResolver = resolvers.find(resolver => resolver.accept(id))

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
