import { Module, ServiceModule } from "../dependency-injection";
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
