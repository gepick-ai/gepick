import { Contribution, InjectableService } from '@gepick/core/common';
import { ApplicationContribution, IApplicationContribution } from './service-c-contribution';

@Contribution(ApplicationContribution)
export class ServiceA extends InjectableService implements IServiceA, IApplicationContribution {
  onStart() {
    this.a();
  }

  a() {
    // eslint-disable-next-line no-console
    console.log("serviceA contriub");
  }
}

export interface IServiceA {
  a: () => void
}
export const IServiceA = ServiceA.createServiceDecorator();
