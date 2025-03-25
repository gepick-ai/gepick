import { Module, ServiceModule } from "@gepick/core/common";
import { PluginHostRpcService } from "./plugin-host-rpc-service";
import { PluginApiRuntimeService } from "./plugin-api-runtime-service";
import { PluginManagerExt } from "./plugin-api/plugin-manager-ext";
import { CommandRegistryExt } from "./plugin-api/command-registry-ext";

@Module({
  services: [
    PluginHostRpcService,
    PluginApiRuntimeService,
    PluginManagerExt,
    CommandRegistryExt,
  ],
})
export class PluginHostModule extends ServiceModule {}
