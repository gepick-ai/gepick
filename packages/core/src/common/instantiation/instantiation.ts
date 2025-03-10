import { inject } from 'inversify';
import { Disposable } from '../lifecycle';
import { ContributionProvider, IContributionProvider } from './service-contribution';

// 加一个{ _serviceBrand?: 'ServiceDecorator' }是为了屏蔽掉ServiceDecorator展开的类型，而是在移入指定装饰器的时候将类型显示成ServiceDecorator<IXXService>
// 加上{ _serviceBrand?: 'ServiceDecorator' }并不会影响显示的具体类型，只是为了让类型显示成ServiceDecorator<IXXService>
export type ServiceDecorator<T = unknown> = ReturnType<typeof inject<T>> & { _serviceBrand?: undefined };
export type ContributionID = symbol & { _serviceBrand?: undefined }
export type ContributionProviderDecorator<T = unknown> = ReturnType<typeof inject<T[]>> & { _serviceBrand?: undefined };

export function createServiceDecorator<T extends InjectableService>(serviceName: string): ServiceDecorator <T> {
  return inject(Symbol.for(serviceName)) as ServiceDecorator<T>
}

export function createContributionProviderDecorator<T extends object>(contributionName: string): [ContributionID, ServiceDecorator<IContributionProvider<T>>] {
  const contributionId = Symbol.for(contributionName)

  return [contributionId, inject(ContributionProvider.getProviderId(contributionId)) as ServiceDecorator<IContributionProvider<T>>]
}

export const CONTRIBUTION_METADATA_KEY = 'contribution'

export abstract class InjectableService extends Disposable {
  constructor() {
    super()
  }

  static getServiceDecorator<T extends InjectableService>(this: new (...args: any) => T): ServiceDecorator<T> {
    return inject(Symbol.for(this.name)) as ServiceDecorator<T>
  }

  static getServiceId(): symbol {
    return Symbol.for(this.name)
  }

  static isContribution(): boolean {
    return Reflect.getMetadata(CONTRIBUTION_METADATA_KEY, this) !== undefined
  }

  static getContributionId(): symbol | undefined {
    return Reflect.getMetadata(CONTRIBUTION_METADATA_KEY, this)
  }
}

export function Contribution(contributionId: ContributionID) {
  // eslint-disable-next-line ts/no-unsafe-function-type
  return function (target: Function) {
    Reflect.defineMetadata(CONTRIBUTION_METADATA_KEY, contributionId, target)
  }
}

export type ServiceConstructor = (new (...args: any[]) => any) & { [K in keyof typeof InjectableService]: typeof InjectableService[K] }
