import http from 'http';
import { createContributionProviderDecorator } from '@gepick/core/common'
import { Application, Router } from 'express';

export const [ApplicationContribution, IApplicationContributionProvider] = createContributionProviderDecorator<IApplicationContribution>('ApplicationContribution')
export interface IApplicationContribution {
  onApplicationInit?: (router: Router, app: Application) => void
  onApplicationConfigure?: (router: Router) => void
  onApplicationStart?: (server: http.Server) => void
}
