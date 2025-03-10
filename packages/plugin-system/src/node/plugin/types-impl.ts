export class Disposable {
  private disposable: undefined | (() => void);

  constructor(func: () => void) {
    this.disposable = func;
  }

  /**
   * Dispose this object.
   */
  dispose(): void {
    if (this.disposable) {
      this.disposable();
      this.disposable = undefined;
    }
  }

  static create(func: () => void): Disposable {
    return new Disposable(func);
  }
}
