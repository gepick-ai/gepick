import { interfaces } from "../third-party/inversify";
import { InjectableService } from './instantiation';

export class ContributionProvider<T extends object> extends InjectableService implements IContributionProvider<T> {
  protected services: T[] | undefined;

  static getProviderId(contributionId: symbol) {
    const serviceName = contributionId.description?.split("Contribution")?.[0];

    if (!serviceName) {
      throw new Error(`description of ${contributionId.toString()} must end with 'Contribution'. Current name: ${contributionId.description}`);
    }

    return Symbol.for(serviceName + this.name);
  }

  constructor(
    protected readonly serviceIdentifier: interfaces.ServiceIdentifier<T>,
    protected readonly container: interfaces.Container,
  ) {
    super();
  }

  getContributions(recursive?: boolean): T[] {
    if (this.services === undefined) {
      const currentServices: T[] = [];
      let currentContainer: interfaces.Container | null = this.container;
      while (currentContainer !== null) {
        if (currentContainer.isBound(this.serviceIdentifier)) {
          try {
            currentServices.push(...currentContainer.getAll(this.serviceIdentifier));
          }
          catch (error) {
            console.error("serviceIdentifier", this.serviceIdentifier, error);
          }
        }
        currentContainer = recursive === true ? currentContainer.parent : null;
      }
      this.services = currentServices;
    }
    return this.services;
  }
}

export interface IContributionProvider<T extends object> {
  /**
   * @param recursive `true` if the contributions should be collected from the parent containers as well. Otherwise, `false`. It is `false` by default.
   */
  getContributions: (recursive?: boolean) => T[];
}
