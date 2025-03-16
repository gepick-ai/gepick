import * as ERROR_MSGS from '../constants/error_msgs';
import { BindingScopeEnum, BindingTypeEnum } from '../constants/literal_types';
import { interfaces } from '../interfaces/interfaces';
import { BindingInWhenOnSyntax } from './binding_in_when_on_syntax';
import { BindingWhenOnSyntax } from './binding_when_on_syntax';

class BindingToSyntax<T> implements interfaces.BindingToSyntax<T> {
  // TODO: Implement an internal type `_BindingToSyntax<T>` wherein this member
  // can be public. Let `BindingToSyntax<T>` be the presentational type that
  // depends on it, and does not expose this member as public.
  private readonly _binding: interfaces.Binding<T>;

  constructor(binding: interfaces.Binding<T>) {
    this._binding = binding;
  }

  public to(
    constructor: interfaces.Newable<T>,
  ): interfaces.BindingInWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.Instance;
    this._binding.implementationType = constructor;
    return new BindingInWhenOnSyntax<T>(this._binding);
  }

  public toSelf(): interfaces.BindingInWhenOnSyntax<T> {
    if (typeof this._binding.serviceIdentifier !== 'function') {
      throw new Error(ERROR_MSGS.INVALID_TO_SELF_VALUE);
    }

    const self: interfaces.Newable<T> = this._binding
      .serviceIdentifier as interfaces.Newable<T>;

    return this.to(self);
  }

  public toConstantValue(value: T): interfaces.BindingWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.ConstantValue;
    this._binding.cache = value;
    this._binding.dynamicValue = null;
    this._binding.implementationType = null;
    this._binding.scope = BindingScopeEnum.Singleton;
    return new BindingWhenOnSyntax<T>(this._binding);
  }

  public toDynamicValue(
    func: interfaces.DynamicValue<T>,
  ): interfaces.BindingInWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.DynamicValue;
    this._binding.cache = null;
    this._binding.dynamicValue = func;
    this._binding.implementationType = null;
    return new BindingInWhenOnSyntax<T>(this._binding);
  }

  public toConstructor<T2>(
    constructor: interfaces.Newable<T2>,
  ): interfaces.BindingWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.Constructor;
    this._binding.implementationType = constructor as unknown as T;
    this._binding.scope = BindingScopeEnum.Singleton;
    return new BindingWhenOnSyntax<T>(this._binding);
  }

  public toFactory<T2>(
    factory: interfaces.FactoryCreator<T2>,
  ): interfaces.BindingWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.Factory;
    this._binding.factory = factory;
    this._binding.scope = BindingScopeEnum.Singleton;
    return new BindingWhenOnSyntax<T>(this._binding);
  }

  public toFunction(func: T): interfaces.BindingWhenOnSyntax<T> {
    // toFunction is an alias of toConstantValue
    if (typeof func !== 'function') {
      throw new Error(ERROR_MSGS.INVALID_FUNCTION_BINDING);
    }
    const bindingWhenOnSyntax: interfaces.BindingWhenOnSyntax<T> =
      this.toConstantValue(func);
    this._binding.type = BindingTypeEnum.Function;
    this._binding.scope = BindingScopeEnum.Singleton;
    return bindingWhenOnSyntax;
  }

  public toAutoFactory<T2>(
    serviceIdentifier: interfaces.ServiceIdentifier<T2>,
  ): interfaces.BindingWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.Factory;
    this._binding.factory = (context: interfaces.Context) => {
      const autofactory: () => T2 = () =>
        context.container.get<T2>(serviceIdentifier);
      return autofactory;
    };
    this._binding.scope = BindingScopeEnum.Singleton;
    return new BindingWhenOnSyntax<T>(this._binding);
  }

  public toAutoNamedFactory<T2>(
    serviceIdentifier: interfaces.ServiceIdentifier<T2>,
  ): BindingWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.Factory;
    this._binding.factory = (context: interfaces.Context) => {
      return (named: unknown) =>
        context.container.getNamed<T2>(serviceIdentifier, named as string);
    };
    return new BindingWhenOnSyntax<T>(this._binding);
  }

  public toProvider<T2>(
    provider: interfaces.ProviderCreator<T2>,
  ): interfaces.BindingWhenOnSyntax<T> {
    this._binding.type = BindingTypeEnum.Provider;
    this._binding.provider = provider;
    this._binding.scope = BindingScopeEnum.Singleton;
    return new BindingWhenOnSyntax<T>(this._binding);
  }

  public toService(service: interfaces.ServiceIdentifier<T>): void {
    this._binding.type = BindingTypeEnum.DynamicValue;

    // Service bindings should never ever be cached. This is just a workaround to achieve that. A better design should replace this approach.
    Object.defineProperty(this._binding, 'cache', {
      configurable: true,
      enumerable: true,
      get() {
        return null;
      },
      set(_value: unknown) {},
    });
    this._binding.dynamicValue = (
      context: interfaces.Context,
    ): T | Promise<T> => {
      try {
        return context.container.get<T>(service);
      } catch (_error: unknown) {
        // This is a performance degradation in this edge case, we do need to improve the internal resolution architecture in order to solve this properly.
        return context.container.getAsync<T>(service);
      }
    };
    this._binding.implementationType = null;
  }
}

export { BindingToSyntax };
