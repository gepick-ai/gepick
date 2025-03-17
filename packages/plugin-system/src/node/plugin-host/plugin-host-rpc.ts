import { createServiceDecorator } from "@gepick/core/common";
import { IRpcService, RpcService } from "../../common/rpc-protocol";

export class PluginHostRpcService extends RpcService implements IPluginHostRpcService {
  protected override sendMessage(m: any): void {
    if (process.send) {
      process.send(JSON.stringify(m));
    }
  }

  override initialize() {
    super.initialize();
    // 当前子进程接收到父进程传递过来的消息时会触发message事件
    process.on('message', (message: any) => {
      try {
      // NOTE： 当父进程发送过来消息的时候，将消息通过emitter发送出去 @1
        this.triggerLocalService(JSON.parse(message));
      }
      catch (e) {
        console.error(e);
      }
    });
  }
}

export const IPluginHostRpcService = createServiceDecorator<IPluginHostRpcService>("PluginHostRpcService")
export interface IPluginHostRpcService extends IRpcService {}
