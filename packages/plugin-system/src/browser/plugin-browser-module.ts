import { Module, ServiceModule } from '@gepick/core/common';
import { MainThreadRpcService } from "./main-thread-rpc"
import { CommandRegistryMain } from './plugin-api/command-registry-main';
import { HostedPluginService } from './hosted-plugin';

@Module({
  services: [
    CommandRegistryMain,
    MainThreadRpcService,
    HostedPluginService,
  ],
})
export class PluginBrowserModule extends ServiceModule {};
