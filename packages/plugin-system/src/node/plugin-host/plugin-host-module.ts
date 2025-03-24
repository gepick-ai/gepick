import { Module, ServiceModule } from "@gepick/core/common";
import { PluginHostRpcService } from "./plugin-host-rpc-service";
import { PluginManagerExt } from "./plugin-api/plugin-manager-ext";
import { CommandRegistryExt } from "./plugin-api/command-registry-ext";
import { PluginApiService } from "./plugin-api-service";

@Module({
  services: [
    PluginManagerExt,
    CommandRegistryExt,
    PluginHostRpcService,
    PluginApiService,
  ],
})
export class PluginApiModule extends ServiceModule {}
