import { Module, ServiceModule } from "../framework";
import { MenuCommandAdapterRegistryImpl, MenuCommandExecutorImpl } from "./menu-adapter";
import { MenuModelRegistry } from "./menu-model-registry";

@Module({
  services: [
    MenuModelRegistry,
    MenuCommandAdapterRegistryImpl,
    MenuCommandExecutorImpl,
  ],
})
export class CommonMenuModule extends ServiceModule {}
