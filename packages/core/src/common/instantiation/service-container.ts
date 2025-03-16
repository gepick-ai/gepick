import { Container, interfaces } from "../inversify";
import { ServiceModuleConstructor } from './service-module';
import { ServiceDecorator, createServiceDecorator, getServiceIdentifierFromDecorator } from './instantiation';

export class ServiceContainer extends Container {
  constructor(protected readonly ModuleConstructors?: ServiceModuleConstructor[]) {
    super({ defaultScope: "Singleton", skipBaseClassChecks: true });

    this.injectThis()

    if (ModuleConstructors) {
      this.loadModules(ModuleConstructors);
    }
  }

  loadModule(ModuleConstructor: ServiceModuleConstructor) {
    this.load(new ModuleConstructor(this as any))
  }

  loadModules(ModuleConstructors: ServiceModuleConstructor[]) {
    ModuleConstructors.forEach(MC => this.loadModule(MC));
  }

  protected injectThis = () => {
    this.bind(Symbol.for(ServiceContainer.name)).toConstantValue(this);
  }

  override get<T>(serviceDecorator: ServiceDecorator<any>): T {
    const serviceId = getServiceIdentifierFromDecorator(serviceDecorator)

    if (!serviceId) {
      throw new Error("Make sure to use the 'createServiceDecorator' method from the service, or use the 'createServiceDecorator' function to create a service identifier.")
    }

    return super.get(serviceId) as T
  }
}
export const IServiceContainer = createServiceDecorator<IServiceContainer>("ServiceContainer")
export type IServiceContainer = ServiceContainer
