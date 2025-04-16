/* eslint-disable ts/no-unsafe-function-type */
import "reflect-metadata";
import { Container, ContainerModule, decorate, injectable, interfaces } from "inversify";
import { ServiceConstructor, ServiceIdUtil } from './instantiation';
import { ContributionProvider } from './contribution-provider';

export type ServiceModuleConstructor = (new (container: Container) => ServiceModule);

export const MODULE_METADATA = {
  SERVICES: 'services',
  FACTORIES: 'factories',
};

const metadataKeys = [
  MODULE_METADATA.SERVICES,
  MODULE_METADATA.FACTORIES,
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

interface ServiceFactory { id: symbol; handler: ((context: interfaces.Context) => InstanceType<ServiceConstructor>) }
export interface IModuleMetadata {
  services: ServiceConstructor[];
  factories?: ServiceFactory[];
}

export abstract class ServiceModule extends ContainerModule {
  constructor(container: Container) {
    super((bind) => {
      const services = this.getServices();

      services.forEach((service) => {
        if (!ServiceIdUtil.isInjectable(service)) {
          decorate(injectable(), service);
        }
        this.registerService(bind, container, service);
      });

      const factories = this.getFactories();

      factories?.forEach(factory => this.registerFactory(bind, container, factory));
    });
  }

  static getServices() {
    const services = this.prototype.getServices();
    return services.map(service => service.getServiceId());
  }

  protected getServices(): IModuleMetadata['services'] {
    return Reflect.getMetadata(MODULE_METADATA.SERVICES, this.constructor.prototype);
  }

  protected getFactories(): IModuleMetadata['factories'] {
    return Reflect.getMetadata(MODULE_METADATA.FACTORIES, this.constructor.prototype);
  }

  protected registerService<T extends ServiceConstructor>(bind: interfaces.Bind, container: Container, serviceConstructor: T): void {
    const serviceId = serviceConstructor.getServiceId();
    const contributionId = serviceConstructor.getContributionId();

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

  protected registerFactory<T extends ServiceFactory>(bind: interfaces.Bind, _container: Container, factory: T): void {
    bind(factory.id).toFactory(context => () => factory.handler(context));
  }
}
