import { Module, ServiceModule } from "@gepick/core/common";
import { PluginHostRpcService } from "./plugin-host-rpc"
import { PluginManagerExt } from "./plugin-api/plugin-manager-ext";
import { CommandRegistryExt } from "./plugin-api/command-registry-ext";
import { PluginHostApiService } from "./plugin-host-api";

@Module({
  services: [
    PluginManagerExt,
    CommandRegistryExt,
    PluginHostRpcService,
    PluginHostApiService,
  ],
})
export class PluginApiModule extends ServiceModule {}
