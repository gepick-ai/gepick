import { Contribution, InjectableService } from '@gepick/core/common';
import { IServiceA } from './service-a';
import { ApplicationContribution, IApplicationContribution } from './service-c-contribution';

@Contribution(ApplicationContribution)
export class ServiceB extends InjectableService implements IServiceB, IApplicationContribution {
  constructor(@IServiceA private readonly serviceA: IServiceA) {
    super()
  }

  onStart() {
    // eslint-disable-next-line no-console
    console.log("b contriub");
  }

  a() {
    this.serviceA.a();
  }

  b() {
    // eslint-disable-next-line no-console
    console.log("b");
  }
}

export const IServiceB = ServiceB.getServiceDecorator();
export interface IServiceB {
  a: () => void
  b: () => void
}
