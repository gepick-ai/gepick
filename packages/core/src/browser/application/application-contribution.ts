import { Contribution, InjectableService, createContribution } from '@gepick/core/common';

export const [IApplicationContribution, IApplicationContributionProvider] = createContribution<IApplicationContribution>('ApplicationContribution');
export interface IApplicationContribution {
  /**
   * 应用初始化
   */
  onApplicationInit?: () => void;

  /**
   * 应用启动
   */
  onApplicationStart?: () => void;

}

@Contribution(IApplicationContribution)
export abstract class ApplicationContribution extends InjectableService implements IApplicationContribution {
  onApplicationInit?(): void;

  onApplicationStart?(): void;
}
