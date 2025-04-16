import { IContributionProvider, InjectableService, Optional, createServiceDecorator } from '@gepick/core/common';
import { Widget } from '../widgets';
import { IShell, IView, IViewProvider } from "../shell";
import { IApplicationContribution, IApplicationContributionProvider } from './application-contribution';

export const IApplication = createServiceDecorator<IApplication>("Application");
export type IApplication = Application;

export class Application extends InjectableService {
  constructor(
    @Optional() @IApplicationContributionProvider private readonly applicationContributionProvider: IContributionProvider<IApplicationContribution>,
    @IShell private readonly shell: IShell,
    @IViewProvider private readonly viewProvider: IContributionProvider<IView>,
  ) {
    super();
  }

  async start() {
    // const applicationContributions = this.applicationContributionProvider.getContributions();

    // for (const contribution of applicationContributions) {
    //   contribution.onApplicationInit?.();
    // }

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
    Widget.attach(this.shell, host);
  }

  /**
   * Initialize the shell layout either using the layout restorer service or, if no layout has
   * been stored, by creating the default layout.
   */
  protected async initializeLayout(): Promise<void> {
    const views = this.viewProvider.getContributions();
    views.forEach(view => view.onShellLayoutInit());

    await this.shell.pendingUpdates;
  }
}
