/* eslint-disable ts/no-unsafe-function-type */
import "reflect-metadata";
import { Container, ContainerModule, decorate, injectable, interfaces } from "inversify";
import { ServiceConstructor } from './instantiation';
import { ContributionProvider } from './contribution-provider';

export type ServiceModuleConstructor = (new (container: Container) => ServiceModule);

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

  return (target: Function) => {
    for (const property in metadata) {
      if (Object.hasOwnProperty.call(metadata, property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target.prototype);
      }
    }
  };
}

export interface IModuleMetadata {
  services: ServiceConstructor[];
}

export abstract class ServiceModule extends ContainerModule {
  constructor(container: Container) {
    super((bind) => {
      const services = this.getServices();

      services.forEach(service => this.registerService(bind, container, service));
    });
  }

  static getServices() {
    const services = this.prototype.getServices();
    return services.map(service => service.getServiceId());
  }

  protected getServices(): IModuleMetadata['services'] {
    return Reflect.getMetadata(MODULE_METADATA.SERVICES, this.constructor.prototype);
  }

  protected registerService<T extends ServiceConstructor>(bind: interfaces.Bind, container: Container, serviceConstructor: T): void {
    const serviceId = serviceConstructor.getServiceId();
    const contributionId = serviceConstructor.getContributionId();

    decorate(injectable(), serviceConstructor);
    bind(serviceId).to(serviceConstructor);

    if (contributionId) {
      if (typeof contributionId !== 'symbol') {
        throw new TypeError(`Service ${serviceConstructor.name} must have a static symbol type contribution property.`);
      }

      if (!container.isBound(contributionId)) {
        bind(ContributionProvider.getProviderId(contributionId)).toDynamicValue(ctx => new ContributionProvider(contributionId, ctx.container))
          .inSingletonScope();
      }

      bind(contributionId).toService(serviceId);
    }
  }
}
