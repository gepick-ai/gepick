interface Iterable<T> {
  [Symbol.iterator]: () => Iterator<T>
}

export function isIterable<T = any>(thing: any): thing is Iterable<T> {
  return (
    thing
    && typeof thing === 'object'
    && typeof thing[Symbol.iterator] === 'function'
  );
}
