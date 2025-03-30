import { Contribution, IServiceContainer, InjectableService, RpcConnectionHandler } from '@gepick/core/common';
import { IConnectionHandlerContribution, IMessagingService } from "@gepick/core/node";
import { IPluginClient, IPluginService } from '../../common/plugin-service';
import { IPluginHostProcessManager } from "./plugin-host-process-manager";
import { IPluginDeploymentManager } from './plugin-deployment-manager';

export class PluginService extends InjectableService implements IPluginService {
  private client: IPluginClient;

  constructor(
    @IPluginHostProcessManager private readonly pluginHostProcessManager: IPluginHostProcessManager,
    @IPluginDeploymentManager private readonly pluginDeploymentManager: IPluginDeploymentManager,
  ) {
    super();
  }

  setClient(client: IPluginClient | undefined): void {
    if (client) {
      this.client = client;
    }
  }

  /**
   * 向plugin host process发消息
   */
  onMessage(message: string): Promise<void> {
    this.pluginHostProcessManager.sendMessageToPluginHostProcess(message);

    return Promise.resolve();
  }

  /**
   * 启动plugin host process并准备随时从plugin host process收消息
   */
  async startPluginHostProcess() {
    await this.pluginHostProcessManager.startPluginHostProcess();

    this.pluginHostProcessManager.onPluginHostProcessMessage((message) => {
      if (this.client) {
        this.client.onMessage(message);
      }
    });

    return Promise.resolve();
  }

  /**
   * 关闭plugin host process
   */
  stopPluginHostProcess() {
    this.pluginHostProcessManager.stopPluginHostProcess();
  }

  async getDeployedPlugins(): Promise<any[]> {
    return this.pluginDeploymentManager.getDeployedPlugins();
  }
}

@Contribution(IConnectionHandlerContribution)
export class PluginServiceConnectionHandler extends InjectableService implements IConnectionHandlerContribution {
  constructor(
    @IServiceContainer private readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  onConfigureConnectionHandler(messagingService: IMessagingService) {
    messagingService.addHandler(new RpcConnectionHandler("/services/plugin", (client: IPluginClient) => {
      const pluginService = this.serviceContainer.get<IPluginService>(IPluginService);
      pluginService.setClient(client);

      return pluginService;
    }));
  }
}
