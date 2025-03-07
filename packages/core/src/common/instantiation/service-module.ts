import "reflect-metadata"
import { ContainerModule, decorate, injectable, interfaces } from "inversify";
import { ServiceConstructor } from './instantiation';

export type ServiceModuleConstructor = (new () => ServiceModule)

export const MODULE_METADATA = {
  SERVICES: 'services',
};

const metadataKeys = [
  MODULE_METADATA.SERVICES,
];
export const INVALID_MODULE_CONFIG_MESSAGE = (
  _text: TemplateStringsArray,
  property: string,
) => `Invalid property '${property}' passed into the @Module() decorator.`;

export function validateModuleKeys(keys: string[]) {
  const validateKey = (key: string) => {
    if (metadataKeys.includes(key)) {
      return;
    }
    throw new Error(INVALID_MODULE_CONFIG_MESSAGE`${key}`);
  };
  keys.forEach(validateKey);
}

export function Module(metadata: IModuleMetadata) {
  const propsKeys = Object.keys(metadata);
  validateModuleKeys(propsKeys);

  // eslint-disable-next-line ts/no-unsafe-function-type
  return (target: Function) => {
    for (const property in metadata) {
      if (Object.hasOwnProperty.call(metadata, property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target.prototype);
      }
    }
  };
}

export interface IModuleMetadata {
  services: ServiceConstructor[]
}

export abstract class ServiceModule extends ContainerModule {
  constructor() {
    super((bind) => {
      const services = this.getServices()
      services.forEach(service => this.registerService(bind, service));
    })
  }

  static getServices(): symbol[] {
    const services = this.prototype.getServices()
    return services.map(service => service.serviceId)
  }

  protected registerService<T extends ServiceConstructor>(bind: interfaces.Bind, serviceConstructor: T): void {
    bind(serviceConstructor.serviceId).to(this.createService(serviceConstructor));
  }

  protected createService<Ctor extends new (...args: any[]) => any>(serviceConstructor: Ctor) {
    decorate(injectable(), serviceConstructor)

    return serviceConstructor
  }

  protected getServices(): IModuleMetadata['services'] {
    return Reflect.getMetadata(MODULE_METADATA.SERVICES, this.constructor.prototype)
  }
}
