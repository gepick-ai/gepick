import { createContributionsDecorator } from '@gepick/core/common'
import { Application, Router } from 'express';

export const [ApplicationContribution, IApplicationContributions] = createContributionsDecorator<IApplicationContribution[]>('ApplicationContribution')
export interface IApplicationContribution {
  onApplicationInit?: (router: Router, app: Application) => void
  onApplicationConfigure?: (router: Router) => void
  onApplicationStart?: (router: Router) => void
}
