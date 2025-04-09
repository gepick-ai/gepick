import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { Widget } from '../widgets';
import { IApplicationShell } from '../shell/application-shell';
import { ISearchInWorkspaceFrontendContribution } from "../shell/view-contribution";

export const IApplication = createServiceDecorator<IApplication>("Application");
export type IApplication = Application;

export class Application extends InjectableService {
  constructor(
    @IApplicationShell private readonly applicationShell: IApplicationShell,
    @ISearchInWorkspaceFrontendContribution private readonly searchInWorkspaceFrontendContribution: ISearchInWorkspaceFrontendContribution,
  ) {
    super();
  }

  async start() {
    const host = await this.getHost();

    this.attachShell(host);

    await new Promise(resolve => requestAnimationFrame(resolve));

    this.initializeLayout();
  }

  /**
   * Return a promise to the host element to which the application shell is attached.
   */
  protected getHost(): Promise<HTMLElement> {
    const appRoot = document.getElementById("app");

    if (appRoot) {
      return Promise.resolve(appRoot);
    }

    return new Promise<HTMLElement>((resolve, reject) =>
      window.addEventListener('load', () => {
        const appRoot = document.getElementById("app");
        if (appRoot) {
          resolve(appRoot);
        }

        reject(appRoot);
      }, { once: true }),
    );
  }

  protected attachShell(host: HTMLElement): void {
    Widget.attach(this.applicationShell, host);
  }

  /**
   * Initialize the shell layout either using the layout restorer service or, if no layout has
   * been stored, by creating the default layout.
   */
  protected async initializeLayout(): Promise<void> {
    this.searchInWorkspaceFrontendContribution.initializeLayout();
  }
}
