import { Module, ServiceModule } from "@gepick/core/common";
import { PluginHostRpcService } from "./plugin-host-rpc"
import { PluginManagerExt } from "./plugin-api/plugin-manager-ext";
import { CommandRegistryExt } from "./plugin-api/command-registry-ext";

@Module({
  services: [
    PluginManagerExt,
    CommandRegistryExt,
    PluginHostRpcService,
  ],
})
export class PluginApiModule extends ServiceModule {}
