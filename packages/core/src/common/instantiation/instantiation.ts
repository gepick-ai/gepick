import { inject } from 'inversify';
import { Disposable } from '../lifecycle';
import { ContributionProvider, IContributionProvider } from './contribution-provider';

// 加一个{ _serviceBrand?: 'ServiceDecorator' }是为了屏蔽掉ServiceDecorator展开的类型，而是在移入指定装饰器的时候将类型显示成ServiceDecorator<IXXService>
// 加上{ _serviceBrand?: 'ServiceDecorator' }并不会影响显示的具体类型，只是为了让类型显示成ServiceDecorator<IXXService>
export type ServiceDecorator<T = unknown> = ReturnType<typeof inject<T>> & { _serviceBrand?: undefined };
export type ContributionId = symbol & { _serviceBrand?: undefined };
export type ContributionProviderDecorator<T = unknown> = ReturnType<typeof inject<T[]>> & { _serviceBrand?: undefined };

export namespace ServiceIdUtil {
  const SERVICE_ID_KEY = 'serviceId';
  /**
   * 往service decorator身上定义对应的service id。二者的相关联系是它们都来自于同一个service class name所创建。
   * 比如，CommandService，
   * 通过`const ICommandService = createServiceDecorator(CommandService.name)`获取到decorator `ICommandService`。
   * 通过`const CommandServiceId = Symbol.for(CommandService.name)`获取到serviceId`CommandServiceId`。
   * 而这个函数要做的内容就是，往`ICommandService`设置一个属性`serviceId`，然后其值就是CommandServiceId，也就是`Symbol.for(CommandService.name)`。
   * @param decorator 通过createServiceDecorator function创建出来的service decorator
   * @param serviceId Symbol.for(service class name)
   */
  export function defineServiceIdForDecorator(decorator: ServiceDecorator<any>, serviceId: symbol) {
    Reflect.defineProperty(decorator, SERVICE_ID_KEY, {
      value: serviceId,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }

  /**
   * NOTE： 由于我们在service container中重写了inversify的container的get方法。
   * 我们会拿这个函数来获取decorator换取对应的service。它的使用方式就跟你直接在service类中使用decorator直接注入服务一样。
   * 比如，目前我们允许直接使用IFileService这个decorator直接通过类注入，也可以使用container.get(IFileService)的方式来获取服务实例。
   * 但是因为inversify内部会用到get获取相关服务，所以我们需要判断decorator可能不是个function，不是的话直接返回。不然的话，由于decorator
   * 是一个symbol，那么走一回这个函数，逻辑直接会来到Reflect.get(decorator, SERVICE_IDENTIFIER_KEY)，拿到的就是一个undefined。
   * 于是内部get就会出问题，报错信息类似于：You are attempting to construct Symbol(ApplicationContribution) in a synchronous way but it has asynchronous dependencies.
   * 但实际上是我们重写get的时候，没对传入的decorator参数判断造成的。
   */
  export function getServiceIdFromDecorator(decorator: ServiceDecorator<any>) {
  // FIX：解决重写inversify container的get方法入参没正确判断导致获取到undefined出现：You are attempting to construct Symbol(ApplicationContribution) in a synchronous way but it has asynchronous dependencies.的问题。
    if (typeof decorator !== 'function') {
      return decorator;
    }

    return Reflect.get(decorator, SERVICE_ID_KEY);
  }
}

export function createServiceDecorator<T>(serviceName: string): ServiceDecorator<T> {
  const serviceId = Symbol.for(serviceName);
  const decorator = inject(serviceId);

  ServiceIdUtil.defineServiceIdForDecorator(decorator, serviceId);

  return decorator as ServiceDecorator<T>;
}

export const CONTRIBUTION_METADATA_KEY = 'contributionId';

/**
 * 向class类元数据注入'contribution' 属性，其值为contributionId。
 */
export function Contribution(contributionId: ContributionId) {
  // eslint-disable-next-line ts/no-unsafe-function-type
  return function (target: Function) {
    Reflect.defineMetadata(CONTRIBUTION_METADATA_KEY, contributionId, target);
  };
}

/**
 * 使用示例：
 * ```typescript
 * // 创建LocalService Contribution
 * const [ILocalService, ILocalServiceProvider] = createContribution<ILocalService>("LocalService");
 * export interface ILocalService {
 *     onRpcServiceInit: () => void;
 * }
 *
 * // 定义一个service为LocalService Contribution
 * @Contribution(ILocalService)
 * class CommandRegistryExt {}
 *
 * // 获取所有ILocalService
 * class Application {
 *     constructor(@ILocalServiceProvider private readonly localServiceProvider: IContributionProvider<ILocalService>) {}
 *
 *     getAllLocalServices() {
 *         const services = this.localServiceProvider.getContributions();
 *
 *         services.forEach(s => s.onRpcServiceInit());
 *     }
 * }
 *
 * ```
 */
export function createContribution<T extends object>(contributionName: string): [ContributionId, ServiceDecorator<IContributionProvider<T>>] {
  const contributionId = Symbol.for(contributionName);
  const providerId = ContributionProvider.getProviderId(contributionId);
  const decorator = inject(providerId) as ServiceDecorator<IContributionProvider<T>>;

  ServiceIdUtil.defineServiceIdForDecorator(decorator, providerId);

  return [contributionId, decorator];
}

export abstract class InjectableService extends Disposable {
  /**
   * 获取当前service类的service id
   */
  static getServiceId(): symbol {
    return Symbol.for(this.name);
  }

  /**
   * 判断一个service类是否属于一个contribution
   */
  static isContribution(): boolean {
    return Reflect.getMetadata(CONTRIBUTION_METADATA_KEY, this) !== undefined;
  }

  /**
   * 获取当前service类的contribution id
   */
  static getContributionId(): symbol | undefined {
    return Reflect.getMetadata(CONTRIBUTION_METADATA_KEY, this);
  }
}

export type ServiceConstructor = (new (...args: any[]) => any) & { [K in keyof typeof InjectableService]: typeof InjectableService[K] };
