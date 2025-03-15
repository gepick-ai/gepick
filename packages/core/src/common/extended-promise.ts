/* eslint-disable ts/ban-ts-comment */
// @ts-ignore
// @ts-nocheck
export class ExtendedPromise<T> implements Promise<T> {
  private delegate: Promise<T>;
  private resolveDelegate: (value?: T) => void;
  private rejectDelegate: (reason?: T) => void;
  constructor() {
    this.delegate = new Promise((resolve, reject) => {
      this.resolveDelegate = resolve as any;
      this.rejectDelegate = reject;
    });
  }

  [Symbol.toStringTag]: string;

  resolve(value: T): void {
    this.resolveDelegate(value);
  }

  reject(err: any): void {
    this.rejectDelegate(err);
  }

  then<TResult1 = T, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: T) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
    return this.delegate.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<any> {
    return this.delegate.catch(onrejected);
  }

  finally(onfinally?: () => void): Promise<any> {
    return this.delegate.finally(onfinally);
  }

  [Symbol.toStringTag]: "Promise";

  public static any<T>(promises: PromiseLike<T>[]): ExtendedPromise<{ key: number, value: PromiseLike<T> }> {
    const result = new ExtendedPromise<{ key: number, value: PromiseLike<T> }>();
    if (promises.length === 0) {
      result.resolveDelegate();
    }

    promises.forEach((val, key) => {
      Promise.resolve(promises[key]).then(() => {
        result.resolveDelegate({ key, value: promises[key] });
      }, (_err) => {
        result.resolveDelegate({ key, value: promises[key] });
      });
    });
    return result;
  }
}
