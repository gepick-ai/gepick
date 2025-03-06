/* eslint-disable ts/no-namespace */
import { Emitter, Event } from "@gepick/plugin-system/common";

export interface Disposable {
  /**
   * Dispose this object.
   */
  dispose: () => void
}

export namespace Disposable {
  export function create(func: () => void): Disposable {
    return {
      dispose: func,
    };
  }
  export const NULL = create(() => { });
}

export class DisposableCollection implements Disposable {
  protected readonly disposables: Disposable[] = [];
  protected readonly onDisposeEmitter = new Emitter<void>();

  get onDispose(): Event<void> {
    return this.onDisposeEmitter.event;
  }

  protected checkDisposed(): void {
    if (this.disposed) {
      this.onDisposeEmitter.fire(undefined);
    }
  }

  get disposed(): boolean {
    return this.disposables.length === 0;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    while (!this.disposed) {
      try {
        this.disposables.pop()!.dispose();
      }
      catch (e) {
        console.error(e);
      }
    }
    this.checkDisposed();
  }

  push(disposable: Disposable): Disposable {
    const disposables = this.disposables;
    disposables.push(disposable);
    const originalDispose = disposable.dispose.bind(disposable);
    const toRemove = Disposable.create(() => {
      const index = disposables.indexOf(disposable);
      if (index !== -1) {
        disposables.splice(index, 1);
      }
      this.checkDisposed();
    });
    disposable.dispose = () => {
      toRemove.dispose();
      originalDispose();
    };
    return toRemove;
  }

  pushAll(disposables: Disposable[]): Disposable[] {
    return disposables.map(disposable =>
      this.push(disposable),
    );
  }
}
