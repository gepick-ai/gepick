import { Module, ServiceModule } from '@gepick/core/common';
import { MainThreadRpcService } from "./main-thread-rpc"
import { CommandRegistryMain } from './plugin-api/command-registry-main';
import { PluginClient } from './plugin-client';

@Module({
  services: [
    CommandRegistryMain,
    MainThreadRpcService,
    PluginClient,
  ],
})
export class PluginBrowserModule extends ServiceModule {};
