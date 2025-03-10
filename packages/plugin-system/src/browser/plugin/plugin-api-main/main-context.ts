import { MAIN } from "../../../common/plugin-api"
import { CommandRegistryMain } from '../plugin-api-main/command-registry-main';

export function setUpPluginApi(rpc: any) {
  const commandRegistryMain = new CommandRegistryMain(rpc);
  rpc.set(MAIN.COMMAND_REGISTRY, commandRegistryMain)
}
