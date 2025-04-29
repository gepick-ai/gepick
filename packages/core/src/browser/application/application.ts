import { IContributionProvider, IMenuModelRegistry, InjectableService, Optional, createServiceDecorator, isOSX } from '@gepick/core/common';
import { Widget } from '../widget';
import { IShell, IView, IViewProvider } from "../shell";
import { animationFrame, preventNavigation } from '../services';
import { IApplicationContribution, IApplicationContributionProvider } from './application-contribution';
import { IApplicationStateService } from './application-state';

export const IApplication = createServiceDecorator<IApplication>("Application");
export type IApplication = Application;

export class Application extends InjectableService {
  constructor(
    @Optional() @IApplicationContributionProvider private readonly applicationContributionProvider: IContributionProvider<IApplicationContribution>,
    @IApplicationStateService protected readonly stateService: IApplicationStateService,
    @IShell private readonly shell: IShell,
    @IViewProvider private readonly viewProvider: IContributionProvider<IView>,
    @IMenuModelRegistry protected readonly menuModelRegistry: IMenuModelRegistry,
  ) {
    super();
  }

  async start() {
    const applicationContributions = this.applicationContributionProvider.getContributions();

    for (const contribution of applicationContributions) {
      contribution.onApplicationInit?.();
      // TODO(@jaylenchen): 重构menu model registry启动方式
      this.menuModelRegistry?.onApplicationInit();
    }
    this.stateService.state = 'started_contributions';

    const host = await this.getHost();
    this.attachShell(host);
    await animationFrame();
    this.stateService.state = 'attached_shell';

    this.initializeLayout();
    this.stateService.state = 'initialized_layout';

    this.registerEventListeners();
    this.stateService.state = 'ready';
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
    for (const view of views) {
      await view?.onShellLayoutInit();
    }

    await this.shell.pendingUpdates;
  }

  protected registerEventListeners(): void {
    window.addEventListener('unload', () => {
      this.stateService.state = 'closing_window';
    });

    window.addEventListener('resize', () => this.shell.update());

    // this.keybindings.registerEventListeners(window);

    document.addEventListener('touchmove', (event) => { event.preventDefault(); }, { passive: false });
    // Prevent forward/back navigation by scrolling in OS X
    if (isOSX) {
      document.body.addEventListener('wheel', preventNavigation, { passive: false });
    }
    // Prevent the default browser behavior when dragging and dropping files into the window.
    document.addEventListener('dragenter', (event) => {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      event.preventDefault();
    }, false);
    document.addEventListener('dragover', (event) => {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      } event.preventDefault();
    }, false);
    document.addEventListener('drop', (event) => {
      event.preventDefault();
    }, false);
  }
}
