import { inject } from 'inversify';
import { Disposable } from '../lifecycle';
import { ContributionProvider, IContributionProvider } from './service-contribution';

// 加一个{ _serviceBrand?: 'ServiceDecorator' }是为了屏蔽掉ServiceDecorator展开的类型，而是在移入指定装饰器的时候将类型显示成ServiceDecorator<IXXService>
// 加上{ _serviceBrand?: 'ServiceDecorator' }并不会影响显示的具体类型，只是为了让类型显示成ServiceDecorator<IXXService>
export type ServiceDecorator<T = unknown> = ReturnType<typeof inject<T>> & { _serviceBrand?: undefined };
export type ContributionID = symbol & { _serviceBrand?: undefined }
export type ContributionProviderDecorator<T = unknown> = ReturnType<typeof inject<T[]>> & { _serviceBrand?: undefined };

const SERVICE_IDENTIFIER_KEY = 'serviceIdentifier';

function defineServiceIdentifierForDecorator(decorator: ServiceDecorator<any>, serviceId: symbol) {
  Reflect.defineProperty(decorator, SERVICE_IDENTIFIER_KEY, {
    value: serviceId,
    writable: false,
    configurable: false,
    enumerable: false,
  })
}

export function createServiceDecorator<T>(serviceName: string): ServiceDecorator<T> {
  const serviceId = Symbol.for(serviceName)
  const decorator = inject(serviceId)

  defineServiceIdentifierForDecorator(decorator, serviceId);

  return decorator as ServiceDecorator<T>
}

export function createContribution<T extends object>(contributionName: string): [ContributionID, ServiceDecorator<IContributionProvider<T>>] {
  const contributionId = Symbol.for(contributionName)
  const providerId = ContributionProvider.getProviderId(contributionId)
  const decorator = inject(providerId) as ServiceDecorator<IContributionProvider<T>>

  defineServiceIdentifierForDecorator(decorator, providerId)

  return [contributionId, decorator]
}

export const CONTRIBUTION_METADATA_KEY = 'contribution'

export abstract class InjectableService extends Disposable {
  constructor() {
    super()
  }

  static createServiceDecorator<T extends InjectableService>(this: new (...args: any) => T): ServiceDecorator<T> {
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
