import { createServiceDecorator } from "@gepick/core/common";
import { IRpcService, RpcService } from "../../common/rpc-protocol";

export interface IPluginHostRpcService extends IRpcService {}

export const IPluginHostRpcService = createServiceDecorator<IPluginHostRpcService>("PluginHostRpcService");

export class PluginHostRpcService extends RpcService implements IPluginHostRpcService {
  protected override sendMessage(message: any): void {
    if (process.send) {
      process.send(JSON.stringify(message));
    }
  }

  override onMessage() {
    // 当前子进程接收到父进程传递过来的消息时会触发message事件
    process.on('message', (message: string) => {
      try {
        this.triggerLocalService(message);
      }
      catch (e) {
        console.error(e);
      }
    });

    return Promise.resolve();
  }
}
