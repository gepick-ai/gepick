import { Container } from "inversify";
import { ServiceModuleConstructor } from './service-module';

export class ServiceContainer extends Container {
  constructor(protected readonly ModuleConstructors: ServiceModuleConstructor[]) {
    super({ defaultScope: "Singleton", skipBaseClassChecks: true });

    this.loadModules(ModuleConstructors);
  }

  protected loadModules(ModuleConstructor: ServiceModuleConstructor[]) {
    ModuleConstructor.forEach(MC => this.load(new MC()));
  }

}
