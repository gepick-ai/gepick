import path from "node:path"
import { Contribution, InjectableService } from "@gepick/core/common";
import { IPluginManagerExt } from '../../../common/plugin-api/plugin-manager';
import { ILocalServiceContribution, LocalServiceContribution } from "../../../common/rpc-protocol";
import { IPluginHostRpcService } from '../plugin-host-rpc';
import { PluginHostContext } from "../../../common/plugin-api/api-context";

export interface IPluginHost {
  initialize: (contextPath: string, pluginMetadata: any) => void

  loadPlugin: (contextPath: string, plugin: any) => void

  stopPlugins: (contextPath: string, pluginIds: string[]) => void
}
interface IPluginModule {
  activate?: () => Promise<void>
  deactivate?: () => void
}
export class ActivatedPlugin {
  constructor(
    public readonly module: IPluginModule,
  ) {}

  deactivate() {
    this.module.deactivate?.()
  }
}

@Contribution(LocalServiceContribution)
export class PluginManagerExt extends InjectableService implements IPluginManagerExt, ILocalServiceContribution {
  private plugins = new Map<string, () => void>();
  private runningPluginIds: string[] = [];
  private readonly registry = new Map<string, any>();
  private readonly activations = new Map<string, ((() => Promise<void>)[]) | undefined>();
  private readonly activatedPlugins = new Map<string, ActivatedPlugin>();

  onRpcServiceInit(pluginHostRpcService: IPluginHostRpcService) {
    pluginHostRpcService.setLocalService(PluginHostContext.PluginManager, this)
  }

  async $start(plugins: any[]): Promise<void> {
    for (const plugin of plugins) {
      this.registerPlugin(plugin);
    }

    await this.$activateByEvent('*');

    return Promise.resolve();
  }

  protected registerPlugin(plugin: any): void {
    this.registry.set(plugin.model.id, plugin);
    const activation = () => this.$activatePlugin(plugin.model.id);
    this.setActivation(`onPlugin:${plugin.model.id}`, activation);

    for (const activationEvent of ['*']) {
      this.setActivation(activationEvent, activation);
    }
  }

  async $activatePlugin(id: string): Promise<void> {
    const plugin = this.registry.get(id);

    if (plugin) {
      this._activatePlugin(plugin);
    }
  }

  async _activatePlugin(plugin: any) {
    const pluginModule = await import(path.resolve(plugin.model.packagePath, plugin.model.entryPoint));
    const pluginMain = pluginModule.default || pluginModule;

    const id = plugin.model.displayName || plugin.model.id;

    if (typeof pluginMain[plugin.lifecycle.startMethod] === 'function') {
      await pluginMain[plugin.lifecycle.startMethod].apply(globalThis, []);
      this.activatedPlugins.set(plugin.model.id, new ActivatedPlugin(pluginMain));
    }
    else {
      // https://github.com/TypeFox/vscode/blob/70b8db24a37fafc77247de7f7cb5bb0195120ed0/src/vs/workbench/api/common/extHostExtensionService.ts#L400-L401
      // eslint-disable-next-line no-console
      console.log(`plugin ${id}, ${plugin.lifecycle.startMethod} method is undefined so the module is the extension's exports`);
      this.activatedPlugins.set(plugin.model.id, new ActivatedPlugin(pluginMain));
    }
  }

  protected setActivation(activationEvent: string, activation: () => Promise<void>) {
    const activations = this.activations.get(activationEvent) || [];
    activations.push(activation);
    this.activations.set(activationEvent, activations);
  }

  async $activateByEvent(activationEvent: string): Promise<void> {
    const activations = this.activations.get(activationEvent);
    if (!activations) {
      return;
    }

    this.activations.set(activationEvent, undefined);
    const pendingActivations = [];
    while (activations.length) {
      const activation = activations.pop()!
      pendingActivations.push(activation());
    }
    await Promise.all(pendingActivations);
  }

  /**
   * 利用plugin host loadPlugin
   */
  async $loadPlugin(contextPath: string, plugin: any): Promise<void> {
    this.runningPluginIds.push("id");
    try {
      // debug
      plugin.pluginPath = "/Users/work/Projects/gepick-plugin-system/.gepick/plugin-a/src/index.js"

      const pluginModule = await import(plugin.pluginPath);
      const pluginMain = pluginModule.default || pluginModule

      // ===startPlugin(plugin, pluginMain, plugins) block-start

      // if (typeof pluginMain[plugin.lifecycle.startMethod] === 'function') {
      pluginMain['activate' as any].apply(globalThis, []);
      // }
      // else {
      //   console.log('there is no doStart method on plugin');
      // }

      // if (typeof pluginMain[plugin.lifecycle.stopMethod] === 'function') {
      //   const pluginId = getPluginId(plugin.model);
      //   plugins.set(pluginId, pluginMain[plugin.lifecycle.stopMethod]);
      // }

      // ===startPlugin(plugin, pluginMain, plugins) block-end
    }
    catch (e: any) {
      console.error(e.stack);
    }
  };

  /**
   * 利用plugin host stopPlugins
   */
  $stopPlugin(_contextPath: string): PromiseLike<void> {
    this.runningPluginIds.forEach((pluginId) => {
      const stopPluginMethod = this.plugins.get(pluginId);
      if (stopPluginMethod) {
        stopPluginMethod();
        this.plugins.delete(pluginId);
      }
    });
    return Promise.resolve()
  };
}
