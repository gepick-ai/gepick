import { Container } from "inversify";
import { ServiceModuleConstructor } from './service-module';
import { createServiceDecorator } from './instantiation';

export class ServiceContainer extends Container {
  constructor(protected readonly ModuleConstructors?: ServiceModuleConstructor[]) {
    super({ defaultScope: "Singleton", skipBaseClassChecks: true });

    this.injectThis()

    if (ModuleConstructors) {
      this.loadModules(ModuleConstructors);
    }
  }

  loadModule(ModuleConstructor: ServiceModuleConstructor) {
    this.load(new ModuleConstructor(this))
  }

  loadModules(ModuleConstructors: ServiceModuleConstructor[]) {
    ModuleConstructors.forEach(MC => this.loadModule(MC));
  }

  protected injectThis = () => {
    this.bind(Symbol.for(ServiceContainer.name)).toConstantValue(this);
  }
}
export const IServiceContainer = createServiceDecorator<IServiceContainer>("ServiceContainer")
export type IServiceContainer = ServiceContainer
