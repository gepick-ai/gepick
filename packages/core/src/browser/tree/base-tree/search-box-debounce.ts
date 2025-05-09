import debounce from 'lodash.debounce';
import { DisposableCollection, Emitter, Event, IDisposable } from '@gepick/core/common';

/**
 * Options for the search term debounce.
 */
export interface SearchBoxDebounceOptions {

  /**
   * The delay (in milliseconds) before the debounce notifies clients about its content change.
   */
  readonly delay: number;

}

export namespace SearchBoxDebounceOptions {

  /**
   * The default debounce option.
   */
  export const DEFAULT: SearchBoxDebounceOptions = {
    delay: 200,
  };

}

/**
 * It notifies the clients, once if the underlying search term has changed after a given amount of delay.
 */
export class SearchBoxDebounce implements IDisposable {
  protected readonly disposables = new DisposableCollection();
  protected readonly emitter = new Emitter<string | undefined>();
  protected readonly handler: () => void;

  protected state: string | undefined;

  constructor(protected readonly options: SearchBoxDebounceOptions) {
    this.disposables.push(this.emitter);
    this.handler = debounce(() => this.fireChanged(this.state), this.options.delay).bind(this);
  }

  append(input: string | undefined): string | undefined {
    if (input === undefined) {
      this.reset();
      return undefined;
    }
    if (this.state === undefined) {
      this.state = input;
    }
    else {
      if (input === '\b') {
        this.state = this.state.length === 1 ? '' : this.state.substring(0, this.state.length - 1);
      }
      else {
        this.state += input;
      }
    }
    this.handler();
    return this.state;
  }

  get onChanged(): Event<string | undefined> {
    return this.emitter.event;
  }

  dispose(): void {
    this.disposables.dispose();
  }

  protected fireChanged(value: string | undefined): void {
    this.emitter.fire(value);
  }

  protected reset(): void {
    this.state = undefined;
    this.fireChanged(undefined);
  }
}
