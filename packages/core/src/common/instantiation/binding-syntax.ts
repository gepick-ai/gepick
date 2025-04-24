/* eslint-disable ts/no-wrapper-object-types */
/* eslint-disable ts/no-unsafe-function-type */

// #region BindingToSyntax

export const CONSTANT_VALUE_METADATA_KEY = 'constant';

/**
 * ```typescript
 *
 * @ConstantValue({foo: 'bar'})
 * class MyService1 extends InjectableService{}
 *
 * @ConstantValue("foo")
 * class MyService2 extends InjectableService{}
 *
 * ```
 */
export function ConstantValue(value: any) {
  return function (target: Function) {
    Reflect.defineMetadata(CONSTANT_VALUE_METADATA_KEY, value, target);
  };
}

export function getConstantValue(target: Object) {
  const constantValue = Reflect.getMetadata(CONSTANT_VALUE_METADATA_KEY, target);

  return constantValue;
}

// #endregion

// #region BindingInSyntax

export enum BindingScope {
  Singleton = 'Singleton',
  Transient = 'Transient',
  Request = 'Request',
}

export const SCOPE_METADATA_KEY = 'scope';
/**
 * ```typescript
 *
 * @Scope(BindingScope.Singleton)
 * class MyService1 extends InjectableService{}
 *
 * @Scope(BindingScope.Transient)
 * class MyService2 extends InjectableService{}
 *
 * @Scope(BindingScope.Request)
 * class MyService2 extends InjectableService{}
 *
 * ```
 */
export function Scope(scope: BindingScope) {
  return function (target: Function) {
    Reflect.defineMetadata(SCOPE_METADATA_KEY, scope, target);
  };
}

export function getBindingScope(target: Object): BindingScope {
  const scope = Reflect.getMetadata(SCOPE_METADATA_KEY, target);

  return scope;
}

// #endregion

// #region BindingOnSyntax

// #endregion

// #region BindingWhenSyntax

// #endregion
