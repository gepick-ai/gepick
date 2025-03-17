import { MainContext } from "@gepick/plugin-system/common/plugin-api"
import { CommandRegistryMain } from '@gepick/plugin-system/browser/plugin-api';
import { IRPCProtocol } from "@gepick/plugin-system/common";

export function setUpPluginApi(rpc: IRPCProtocol) {
  const commandRegistryMain = new CommandRegistryMain(rpc);
  rpc.setLocalService(MainContext.CommandRegistry, commandRegistryMain)
}
