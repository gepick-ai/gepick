import { Container } from "inversify";
import { ServiceModuleConstructor } from './service-module';
import { createServiceDecorator } from './instantiation';

export class ServiceContainer extends Container {
  constructor(protected readonly ModuleConstructors: ServiceModuleConstructor[]) {
    super({ defaultScope: "Singleton", skipBaseClassChecks: true });

    this.injectThis()
    this.loadModules(ModuleConstructors);
  }

  protected loadModules(ModuleConstructor: ServiceModuleConstructor[]) {
    ModuleConstructor.forEach(MC => this.load(new MC(this)));
  }

  protected injectThis = () => {
    this.bind(Symbol.for(ServiceContainer.name)).toConstantValue(this);
  }
}
export const IServiceContainer = createServiceDecorator(ServiceContainer.name)
export type IServiceContainer = ServiceContainer
