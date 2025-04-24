/* eslint-disable ts/no-wrapper-object-types */
/* eslint-disable ts/no-unsafe-function-type */

// ========================================BindingToSyntax========================================

export const CONSTANT_VALUE_METADATA_KEY = 'BindingToSyntax.toConstantValue';

/**
 * ```typescript
 *
 * @ToConstant({foo: 'bar'})
 * class MyService1 extends InjectableService{}
 *
 * @ToConstant("foo")
 * class MyService2 extends InjectableService{}
 *
 * ```
 */
export function ToConstantValue(value: any) {
  return function (target: Function) {
    Reflect.defineMetadata(CONSTANT_VALUE_METADATA_KEY, value, target);
  };
}

export function getConstantValue(target: Object) {
  const constantValue = Reflect.getMetadata(CONSTANT_VALUE_METADATA_KEY, target);

  return constantValue;
}

// ========================================BindingInSyntax========================================

export enum BindingScope {
  Singleton = 'Singleton',
  Transient = 'Transient',
  Request = 'Request',
}

export const SCOPE_METADATA_KEY = 'BindingInSyntax:Scope';

/**
 * ```typescript
 *
 * @InSingletonScope()
 * class MyService1 extends InjectableService{}
 *
 * ```
 */
export function InSingletonScope() {
  return function (target: Function) {
    Reflect.defineMetadata(SCOPE_METADATA_KEY, BindingScope.Singleton, target);
  };
}

/**
 * ```typescript
 *
 * @InTransientScope()
 * class MyService1 extends InjectableService{}
 *
 * ```
 */
export function InTransientScope() {
  return function (target: Function) {
    Reflect.defineMetadata(SCOPE_METADATA_KEY, BindingScope.Transient, target);
  };
}

/**
 * ```typescript
 *
 * @InRequestScope()
 * class MyService1 extends InjectableService{}
 *
 * ```
 */
export function InRequestScope() {
  return function (target: Function) {
    Reflect.defineMetadata(SCOPE_METADATA_KEY, BindingScope.Request, target);
  };
}

export function getBindingScope(target: Object): BindingScope {
  const scope = Reflect.getMetadata(SCOPE_METADATA_KEY, target);

  return scope;
}

// ========================================BindingOnSyntax========================================
export const BindingOnSyntax = {
  onActivation: 'BindingOnSyntax.onActivation',
  onDeactivation: 'BindingOnSyntax.onDeactivation',
};

// #region onActivation

/**
 * ```typescript
 *
 * class MyService1 extends InjectableService {
 *     @OnActivation()
 *     handleActivation(context: interfaces.Context, service:MyService1 ) {
 *         return service
 *     }
 * }
 *
 * ```
 */
export function OnActivation() {
  return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(BindingOnSyntax.onActivation, descriptor.value, target.constructor);
    return descriptor.value;
  };
}

export function getActivationHandler(target: Object) {
  const activationHandler = Reflect.getMetadata(BindingOnSyntax.onActivation, target);

  return activationHandler;
}

// #endregion

// #region onDeactivation

/**
 * ```typescript
 *
 * class MyService1 extends InjectableService {
 *     @OnDeactivation()
 *     handleDeactivation(context: interfaces.Context, service:MyService1 ) {
 *         return service
 *     }
 * }
 *
 * ```
 */
export function onDeactivation() {
  return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(BindingOnSyntax.onDeactivation, descriptor.value, target.constructor);
    return descriptor.value;
  };
}

export function getDeactivationHandler(target: Object) {
  const deactivationHandler = Reflect.getMetadata(BindingOnSyntax.onDeactivation, target);
  return deactivationHandler;
}

// #endregion

// ========================================BindingWhenSyntax========================================
