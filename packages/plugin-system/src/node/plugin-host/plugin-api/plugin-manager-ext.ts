import path from "node:path";
import { Contribution, InjectableService } from "@gepick/core/common";
import { IDeployedPlugin } from "../../../common/plugin-service";
import { IPluginManagerExt } from '../../../common/plugin-api/plugin-manager';
import { IRpcLocalService } from "../../../common/rpc-protocol";
import { IPluginHostRpcService } from '../plugin-host-rpc-service';
import { PluginHostContext } from "../../../common/plugin-api/api-context";

export interface IPluginModule {
  activate?: () => Promise<void>;
  deactivate?: () => void;
}

export interface IPluginHost {
  initialize: (contextPath: string, pluginMetadata: any) => void;

  loadPlugin: (contextPath: string, plugin: any) => void;

  stopPlugins: (contextPath: string, pluginIds: string[]) => void;
}

export class ActivatedPlugin {
  constructor(
    public readonly module: IPluginModule,
  ) {}

  deactivate() {
    this.module.deactivate?.();
  }
}

@Contribution(IRpcLocalService)
export class PluginManagerExt extends InjectableService implements IPluginManagerExt, IRpcLocalService {
  private plugins = new Map<string, () => void>();
  private runningPluginIds: string[] = [];
  private readonly registry = new Map<string, any>();
  private readonly activations = new Map<string, ((() => Promise<void>)[]) | undefined>();
  private readonly activatedPlugins = new Map<string, ActivatedPlugin>();

  onRpcServiceInit(pluginHostRpcService: IPluginHostRpcService) {
    pluginHostRpcService.setLocalService(PluginHostContext.PluginManager, this);
  }

  async $start(plugins: IDeployedPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      this.registerPlugin(plugin);
    }

    await this.$activateByEvent('*');

    return Promise.resolve();
  }

  protected registerPlugin(plugin: IDeployedPlugin): void {
    this.registry.set(plugin.model.identifier.id, plugin);
    const activation = () => this.$activatePlugin(plugin.model.identifier.id);
    this.setActivation(`onPlugin:${plugin.model.identifier.id}`, activation);

    for (const activationEvent of plugin.contributions.activationEvents) {
      this.setActivation(activationEvent, activation);
    }
  }

  async $activatePlugin(id: string): Promise<void> {
    const plugin = this.registry.get(id);

    if (plugin) {
      this._activatePlugin(plugin);
    }
  }

  async _activatePlugin(plugin: IDeployedPlugin) {
    const pluginSource = await import(path.resolve(plugin.model.entryPoint));
    const pluginModule: IPluginModule = pluginSource.default || pluginSource;

    const id = plugin.model.displayName || plugin.model.identifier.id;

    if (typeof pluginModule.activate === 'function') {
      await pluginModule.activate.apply(globalThis, []);
      this.activatedPlugins.set(plugin.model.identifier.id, new ActivatedPlugin(pluginModule));
    }
    else {
      // https://github.com/TypeFox/vscode/blob/70b8db24a37fafc77247de7f7cb5bb0195120ed0/src/vs/workbench/api/common/extHostExtensionService.ts#L400-L401
      // eslint-disable-next-line no-console
      console.log(`plugin ${id}, activate method is undefined so the module is the extension's exports`);
      this.activatedPlugins.set(plugin.model.identifier.id, new ActivatedPlugin(pluginModule));
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
      const activation = activations.pop()!;
      pendingActivations.push(activation());
    }
    await Promise.all(pendingActivations);
  }

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
    return Promise.resolve();
  };
}
