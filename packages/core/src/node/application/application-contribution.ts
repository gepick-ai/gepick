import http from 'http';
import { createContributionProviderDecorator } from '@gepick/core/common'
import { Application, Router } from 'express';

export const [ApplicationContribution, IApplicationContributionProvider] = createContributionProviderDecorator<IApplicationContribution>('ApplicationContribution')
export interface IApplicationContribution {
  /**
   * 应用初始化
   */
  onApplicationInit?: (router: Router, app: Application) => void
  onApplicationConfigure?: (router: Router) => void
  onApplicationStart?: (server: http.Server) => void
}
