import { inject, multiInject } from 'inversify';
import { Disposable } from '../lifecycle';

// 加一个{ _serviceBrand?: 'ServiceIdentifier' }是为了屏蔽掉ServiceIdentifier展开的类型，而是在移入指定装饰器的时候将类型显示成ServiceIdentifier<IXXService>
// 加上{ _serviceBrand?: 'ServiceIdentifier' }并不会影响显示的具体类型，只是为了让类型显示成ServiceIdentifier<IXXService>
export type ServiceIdentifier<T = unknown> = ReturnType<typeof inject<T>> & { _serviceBrand?: undefined }; ;
export type ContributionID = symbol & { _serviceBrand?: undefined }

export function createContributionsDecorator<T = unknown>(contributionName: string): [ContributionID, ServiceIdentifier<T>] {
  const contributionId = Symbol.for(contributionName)

  return [contributionId, multiInject(contributionId) as ServiceIdentifier<T>]
}

export const CONTRIBUTION_METADATA_KEY = 'contribution'

export abstract class InjectableService extends Disposable {
  constructor() {
    super()
  }

  static getServiceDecorator<T extends InjectableService>(this: new (...args: any) => T): ServiceIdentifier<T> {
    return inject(Symbol.for(this.name)) as ServiceIdentifier<T>
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
