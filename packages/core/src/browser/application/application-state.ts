import { Deferred, Emitter, Event, InjectableService, createServiceDecorator } from "@gepick/core/common";

export type ApplicationState =
  'init'
  | 'started_contributions'
  | 'attached_shell'
  | 'initialized_layout'
  | 'ready'
  | 'closing_window';

export enum StopReason {
  /**
   * Closing the window with no prospect of restart.
   */
  Close,
  /**
   * Reload without closing the window.
   */
  Reload,
  /**
   * Reload that includes closing the window.
   */
  Restart,
}

export class ApplicationStateService extends InjectableService {
  private _state: ApplicationState = 'init';

  protected deferred: { [state: string]: Deferred<void> } = {};
  protected readonly stateChanged = new Emitter<ApplicationState>();

  get state(): ApplicationState {
    return this._state;
  }

  set state(state: ApplicationState) {
    if (state !== this._state) {
      this.doSetState(state);
    }
  }

  get onStateChanged(): Event<ApplicationState> {
    return this.stateChanged.event;
  }

  protected doSetState(state: ApplicationState): void {
    if (this.deferred[this._state] === undefined) {
      this.deferred[this._state] = new Deferred();
    }
    const _oldState = this._state;
    this._state = state;
    if (this.deferred[state] === undefined) {
      this.deferred[state] = new Deferred();
    }
    this.deferred[state].resolve();

    // console.info(`Changed application state from '${oldState}' to '${this._state}'.`);
    this.stateChanged.fire(state);
  }

  reachedState(state: ApplicationState): Promise<void> {
    if (this.deferred[state] === undefined) {
      this.deferred[state] = new Deferred();
    }
    return this.deferred[state].promise;
  }

  reachedAnyState(...states: ApplicationState[]): Promise<void> {
    return Promise.race(states.map(s => this.reachedState(s)));
  }
}

export const IApplicationStateService = createServiceDecorator<IApplicationStateService>(ApplicationStateService.name);
export type IApplicationStateService = ApplicationStateService;
