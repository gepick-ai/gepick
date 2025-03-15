import http from 'http';
import { createContribution } from '@gepick/core/common'
import { Application, Router } from 'express';

export const [ApplicationContribution, IApplicationContributionProvider] = createContribution<IApplicationContribution>('ApplicationContribution')
export interface IApplicationContribution {
  /**
   * 应用初始化
   */
  onApplicationInit?: (router: Router, app: Application) => void
  onApplicationConfigure?: (router: Router) => void
  onApplicationStart?: (server: http.Server) => void
}
