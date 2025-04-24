/* eslint-disable ts/no-unsafe-function-type */
import "reflect-metadata";
import { Container, ContainerModule, decorate, injectable, interfaces } from "inversify";
import { ServiceConstructor, ServiceIdUtil } from './instantiation';
import { ContributionProvider } from './contribution-provider';
import { BindingScope, getBindingScope, getConstantValue } from "./binding-syntax";

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
  static getServices() {
    const services = this.prototype.getServices();
    return services.map(service => service.getServiceId());
  }

  constructor(container: Container) {
    super((bind) => {
      this.bindServices(bind, container);
      this.bindFactories(bind, container);
    });
  }

  private bindServices(bind: interfaces.Bind, container: Container) {
    const services = this.getServices();

    services.forEach((service) => {
      if (!ServiceIdUtil.isInjectable(service)) {
        decorate(injectable(), service);
      }
      this.registerService(bind, container, service);
    });
  }

  private bindFactories(bind: interfaces.Bind, container: Container) {
    const factories = this.getFactories();

    factories?.forEach(factory => this.registerFactory(bind, container, factory));
  }

  protected getServices(): IModuleMetadata['services'] {
    return Reflect.getMetadata(MODULE_METADATA.SERVICES, this.constructor.prototype);
  }

  protected getFactories(): IModuleMetadata['factories'] {
    return Reflect.getMetadata(MODULE_METADATA.FACTORIES, this.constructor.prototype);
  }

  protected registerService<T extends ServiceConstructor>(bind: interfaces.Bind, container: Container, serviceConstructor: T): void {
    this.resolveBinding(container, serviceConstructor);
  }

  protected registerFactory<T extends ServiceFactory>(bind: interfaces.Bind, _container: Container, factory: T): void {
    bind(factory.id).toFactory(context => () => factory.handler(context));
  }

  private resolveBinding<T extends ServiceConstructor>(container: Container, target: T) {
    // bindingToSyntax.toConstantValue
    // 可以设计一个ConstantValue装饰器来绑定constant value

    // bindingToSyntax.to
    // 默认的服务绑定

    // bindingToSyntax.toFactory [X]
    // 我们不需要factory，设计service得时候本身就可以拿到service container，我们可以设计一个create方法，直接绑定service factory class，
    // 然后获得的实例来调用create方法也能够获得跟toFactory一样的效果

    // bindingToSyntax.toDynamicValue [X]
    // 我们不需要DynamicValue，理由跟toFactory一样

    // bindingToSyntax.toService [X]
    // 我们已经设计了contribution这个概念，它就是toService
    const serviceId = target.getServiceId();
    const bindingToSyntax = container.bind<T>(serviceId);
    const constantValue = getConstantValue(target);
    if (constantValue) {
      bindingToSyntax.toConstantValue(constantValue);
    }
    else {
      const bindingInWhenOnSyntax = bindingToSyntax.to(target);
      this.resolveBindingToScope<T>(bindingInWhenOnSyntax, target);
    }

    this.resolveBindingToContribution(container, target);
  }

  private resolveBindingToScope<T extends ServiceConstructor>(bindingInWhenOnSyntax: interfaces.BindingInWhenOnSyntax<T>, target: T): interfaces.BindingWhenOnSyntax<T> {
    const scope = getBindingScope(target);

    switch (scope) {
      case BindingScope.Singleton: {
        return bindingInWhenOnSyntax.inSingletonScope();
      }
      case BindingScope.Request: {
        return bindingInWhenOnSyntax.inRequestScope();
      }
      case BindingScope.Transient: {
        return bindingInWhenOnSyntax.inTransientScope();
      }
      default: {
        return bindingInWhenOnSyntax.inSingletonScope();
      }
    }
  }

  private resolveBindingToContribution<T extends ServiceConstructor>(container: Container, target: T) {
    const serviceId = target.getServiceId();
    const contributionId = target.getContributionId();

    if (contributionId) {
      if (typeof contributionId !== 'symbol') {
        throw new TypeError(`Service ${target.name} must have a static symbol type contribution property.`);
      }

      if (!container.isBound(contributionId)) {
        container.bind(ContributionProvider.getProviderId(contributionId)).toDynamicValue(ctx => new ContributionProvider(contributionId, ctx.container))
          .inSingletonScope();
      }

      container.bind(contributionId).toService(serviceId);
    }
  }
}
