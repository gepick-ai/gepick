import { createContribution } from '@gepick/core/common';

export const [IApplicationContribution, IApplicationContributionProvider] = createContribution<IApplicationContribution>('ApplicationContribution');
export interface IApplicationContribution {
  /**
   * 应用初始化
   */
  onApplicationInit?: () => void;

}
