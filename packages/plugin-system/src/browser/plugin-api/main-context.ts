import { MainContext } from "@gepick/plugin-system/common/plugin-api"
import { CommandRegistryMain } from '@gepick/plugin-system/browser/plugin-api';

export function setUpPluginApi(rpc: any) {
  const commandRegistryMain = new CommandRegistryMain(rpc);
  rpc.set(MainContext.CommandRegistry, commandRegistryMain)
}
