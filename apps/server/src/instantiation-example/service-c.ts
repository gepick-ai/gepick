import { InjectableService, optional } from '@gepick/core/common';
import { IServiceB } from './service-b';
import { IApplicationContribution, IApplicationContributions } from './service-c-contribution';

export class ServiceC extends InjectableService implements IServiceC{
  constructor(
    @IServiceB private readonly serviceB: IServiceB,
    @optional() @IApplicationContributions private readonly applicationContributions: IApplicationContribution[],
  ) {
    super()
  }

  b() {
    this.serviceB.b();

    // eslint-disable-next-line no-console
    console.log("this.app contrib", this.applicationContributions)
    this.applicationContributions.forEach((contribution) => {
      contribution.onStart();
    })
  }
}

export const IServiceC = ServiceC.createServiceDecorator();
export interface IServiceC {
  b: () => void
}
