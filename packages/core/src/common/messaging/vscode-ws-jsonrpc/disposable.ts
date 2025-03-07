/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable, Emitter, Event } from 'vscode-jsonrpc';

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
      this.disposables.pop()!.dispose();
    }
    this.checkDisposed();
  }

  push(disposable: Disposable): Disposable {
    const disposables = this.disposables;
    disposables.push(disposable);
    return Disposable.create(() => {
      const index = disposables.indexOf(disposable);
      if (index !== -1) {
        disposables.splice(index, 1);
      }
      this.checkDisposed();
    });
  }

  pushAll(disposables: Disposable[]): Disposable[] {
    return disposables.map(disposable =>
      this.push(disposable),
    );
  }
}
