import { IRPCProtocol, RPCProtocol, RpcProtocolService } from "../../common/rpc-protocol";

export class PluginHostRpcService extends RpcProtocolService {
  protected override onRpcServiceInit(): IRPCProtocol {
    return new RPCProtocol({
      onMessage: RpcProtocolService.onMessage,
      send: (m: any) => {
        if (process.send) {
          process.send(JSON.stringify(m));
        }
      },
    });
  }
}

export const IPluginHostRpcService = PluginHostRpcService.createServiceDecorator()
export type IPluginHostRpcService = PluginHostRpcService
