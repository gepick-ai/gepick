import { Mutex, MutexInterface } from "async-mutex";
import { InjectableService, PostConstruct } from "./framework";
import { Emitter, Event, WaitUntilEvent } from "./event";
import { Deferred } from "./promise-util";
import { MaybePromise } from "./types";
import { CancellationError } from "./cancellation";

export interface OnWillConcludeEvent<T> extends WaitUntilEvent {
  status: T | false;
}
/**
 * Represents a batch of interactions with an underlying resource.
 */
export abstract class TransactionService<Arguments extends unknown[], Result = unknown, Status = unknown> extends InjectableService {
  protected _open = true;
  /**
     * Whether the transaction is still accepting new interactions.
     * Enqueueing an action when the Transaction is no longer open will throw an error.
     */
  get open(): boolean {
    return this._open;
  }

  protected _result = new Deferred<Result | false>();
  /**
     * The status of the transaction when complete.
     */
  get result(): Promise<Result | false> {
    return this._result.promise;
  }

  /**
     * The transaction will self-dispose when the queue is empty, once at least one action has been processed.
     */
  protected readonly queue = new Mutex(new CancellationError());
  protected readonly onWillConcludeEmitter = new Emitter<OnWillConcludeEvent<Status>>();
  /**
     * An event fired when the transaction is wrapping up.
     * Consumers can call `waitUntil` on the event to delay the resolution of the `result` Promise.
     */
  get onWillConclude(): Event<OnWillConcludeEvent<Status>> {
    return this.onWillConcludeEmitter.event;
  }

  protected status = new Deferred<Status>();
  /**
     * Whether any actions have been added to the transaction.
     * The Transaction will not self-dispose until at least one action has been performed.
     */
  protected inUse = false;

  @PostConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    const release = await this.queue.acquire();
    try {
      const status = await this.setUp();
      this.status.resolve(status);
    }
    catch {
      this.dispose();
    }
    finally {
      release();
    }
  }

  async waitFor(delay?: Promise<unknown>, disposeIfRejected?: boolean): Promise<void> {
    try {
      await this.queue.runExclusive(() => delay);
    }
    catch {
      if (disposeIfRejected) {
        this.dispose();
      }
    }
  }

  /**
     * @returns a promise reflecting the result of performing an action. Typically the promise will not resolve until the whole transaction is complete.
     */
  async enqueueAction(...args: Arguments): Promise<Result | false> {
    if (this._open) {
      let release: MutexInterface.Releaser | undefined;
      try {
        release = await this.queue.acquire();
        if (!this.inUse) {
          this.inUse = true;
          this.disposeWhenDone();
        }
        return this.act(...args);
      }
      catch (e) {
        if (e instanceof CancellationError) {
          throw e;
        }
        return false;
      }
      finally {
        release?.();
      }
    }
    else {
      throw new Error('Transaction used after disposal.');
    }
  }

  protected disposeWhenDone(): void {
    // Due to properties of the micro task system, it's possible for something to have been enqueued between
    // the resolution of the waitForUnlock() promise and the the time this code runs, so we have to check.
    this.queue.waitForUnlock().then(() => {
      if (!this.queue.isLocked()) {
        this.dispose();
      }
      else {
        this.disposeWhenDone();
      }
    });
  }

  protected async conclude(): Promise<void> {
    if (this._open) {
      try {
        this._open = false;
        this.queue.cancel();
        const result = await this.tearDown();
        const status = this.status.state === 'unresolved' || this.status.state === 'rejected' ? false : await this.status.promise;
        await WaitUntilEvent.fire(this.onWillConcludeEmitter, { status });
        this.onWillConcludeEmitter.dispose();
        this._result.resolve(result);
      }
      catch {
        this._result.resolve(false);
      }
    }
  }

  override dispose(): void {
    this.conclude();
  }

  /**
     * Runs any code necessary to initialize the batch of interactions. No interaction will be run until the setup is complete.
     *
     * @returns a representation of the success of setup specific to a given transaction implementation.
     */
  protected abstract setUp(): MaybePromise<Status>;
  /**
     * Performs a single interaction
     *
     * @returns the result of that interaction, specific to a given transaction type.
     */
  protected abstract act(...args: Arguments): MaybePromise<Result>;
  /**
     * Runs any code necessary to complete a transaction and release any resources it holds.
     *
     * @returns implementation-specific information about the success of the transaction. Will be used as the final status of the transaction.
     */
  protected abstract tearDown(): MaybePromise<Result>;
}
