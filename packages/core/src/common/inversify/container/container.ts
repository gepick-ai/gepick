import { Binding } from '../bindings/binding';
import * as ERROR_MSGS from '../constants/error_msgs';
import { BindingScopeEnum, TargetTypeEnum } from '../constants/literal_types';
import * as METADATA_KEY from '../constants/metadata_keys';
import { interfaces } from '../interfaces/interfaces';
import { MetadataReader } from '../planning/metadata_reader';
import {
  PlanMetadata,
  createMockRequest,
  getBindingDictionary,
  plan,
} from '../planning/planner';
import { resolve } from '../resolution/resolver';
import { BindingToSyntax } from '../syntax/binding_to_syntax';
import { isPromise, isPromiseOrContainsPromise } from '../utils/async';
import { id } from '../utils/id';
import { getServiceIdentifierAsString } from '../utils/serialization';
import { ContainerSnapshot } from './container_snapshot';
import { Lookup } from './lookup';
import { ModuleActivationStore } from './module_activation_store';

type GetArgs<T> = Omit<
  interfaces.NextArgs<T>,
  'contextInterceptor' | 'targetType'
>;

class Container implements interfaces.Container {
  public id: number;
  public parent: interfaces.Container | null;
  public readonly options: interfaces.ContainerOptions;
  private _middleware: interfaces.Next | null;
  private _bindingDictionary: interfaces.Lookup<interfaces.Binding<unknown>>;
  private _activations: interfaces.Lookup<
    interfaces.BindingActivation<unknown>
  >;

  private _deactivations: interfaces.Lookup<
    interfaces.BindingDeactivation<unknown>
  >;

  private readonly _snapshots: interfaces.ContainerSnapshot[];
  private _metadataReader: interfaces.MetadataReader;
  private _moduleActivationStore: interfaces.ModuleActivationStore;

  constructor(containerOptions?: interfaces.ContainerOptions) {
    const options: interfaces.ContainerOptions = containerOptions || {};
    if (typeof options !== 'object') {
      throw new TypeError(ERROR_MSGS.CONTAINER_OPTIONS_MUST_BE_AN_OBJECT);
    }

    if (options.defaultScope === undefined) {
      options.defaultScope = BindingScopeEnum.Transient;
    }
    else if (
      options.defaultScope !== BindingScopeEnum.Singleton
      && options.defaultScope !== BindingScopeEnum.Transient
      && options.defaultScope !== BindingScopeEnum.Request
    ) {
      throw new Error(ERROR_MSGS.CONTAINER_OPTIONS_INVALID_DEFAULT_SCOPE);
    }

    if (options.autoBindInjectable === undefined) {
      options.autoBindInjectable = false;
    }
    else if (typeof options.autoBindInjectable !== 'boolean') {
      throw new TypeError(
        ERROR_MSGS.CONTAINER_OPTIONS_INVALID_AUTO_BIND_INJECTABLE,
      );
    }

    if (options.skipBaseClassChecks === undefined) {
      options.skipBaseClassChecks = false;
    }
    else if (typeof options.skipBaseClassChecks !== 'boolean') {
      throw new TypeError(ERROR_MSGS.CONTAINER_OPTIONS_INVALID_SKIP_BASE_CHECK);
    }

    this.options = {
      autoBindInjectable: options.autoBindInjectable,
      defaultScope: options.defaultScope,
      skipBaseClassChecks: options.skipBaseClassChecks,
    };

    this.id = id();
    this._bindingDictionary = new Lookup<interfaces.Binding<unknown>>();
    this._snapshots = [];
    this._middleware = null;
    this._activations = new Lookup<interfaces.BindingActivation<unknown>>();
    this._deactivations = new Lookup<interfaces.BindingDeactivation<unknown>>();
    this.parent = null;
    this._metadataReader = new MetadataReader();
    this._moduleActivationStore = new ModuleActivationStore();
  }

  public static merge(
    container1: interfaces.Container,
    container2: interfaces.Container,
    ...containers: interfaces.Container[]
  ): interfaces.Container {
    const container: Container = new Container();
    const targetContainers: interfaces.Lookup<interfaces.Binding<unknown>>[] = [
      container1,
      container2,
      ...containers,
    ].map((targetContainer: interfaces.Container) =>
      getBindingDictionary(targetContainer),
    );
    const bindingDictionary: interfaces.Lookup<interfaces.Binding<unknown>>
      = getBindingDictionary(container);

    function copyDictionary(
      origin: interfaces.Lookup<interfaces.Binding<unknown>>,
      destination: interfaces.Lookup<interfaces.Binding<unknown>>,
    ) {
      origin.traverse(
        (_key: interfaces.ServiceIdentifier, value: interfaces.Binding[]) => {
          value.forEach((binding: interfaces.Binding) => {
            destination.add(binding.serviceIdentifier, binding.clone());
          });
        },
      );
    }

    targetContainers.forEach(
      (targetBindingDictionary: interfaces.Lookup<interfaces.Binding>) => {
        copyDictionary(targetBindingDictionary, bindingDictionary);
      },
    );

    return container;
  }

  public load(...modules: interfaces.ContainerModule[]): void {
    // eslint-disable-next-line @typescript-eslint/typedef
    const getHelpers = this._getContainerModuleHelpersFactory();

    for (const currentModule of modules) {
      // eslint-disable-next-line @typescript-eslint/typedef
      const containerModuleHelpers = getHelpers(currentModule.id);

      currentModule.registry(
        containerModuleHelpers.bindFunction,
        containerModuleHelpers.unbindFunction,
        containerModuleHelpers.isboundFunction,
        containerModuleHelpers.rebindFunction,
        containerModuleHelpers.unbindAsyncFunction,
        containerModuleHelpers.onActivationFunction,
        containerModuleHelpers.onDeactivationFunction,
      );
    }
  }

  public async loadAsync(...modules: interfaces.AsyncContainerModule[]) {
    // eslint-disable-next-line @typescript-eslint/typedef
    const getHelpers = this._getContainerModuleHelpersFactory();

    for (const currentModule of modules) {
      // eslint-disable-next-line @typescript-eslint/typedef
      const containerModuleHelpers = getHelpers(currentModule.id);

      await currentModule.registry(
        containerModuleHelpers.bindFunction,
        containerModuleHelpers.unbindFunction,
        containerModuleHelpers.isboundFunction,
        containerModuleHelpers.rebindFunction,
        containerModuleHelpers.unbindAsyncFunction,
        containerModuleHelpers.onActivationFunction as interfaces.Container['onActivation'],
        containerModuleHelpers.onDeactivationFunction as interfaces.Container['onDeactivation'],
      );
    }
  }

  public unload(...modules: interfaces.ContainerModuleBase[]): void {
    modules.forEach((module: interfaces.ContainerModuleBase) => {
      const deactivations: interfaces.Binding[] = this._removeModuleBindings(
        module.id,
      );
      this._deactivateSingletons(deactivations);

      this._removeModuleHandlers(module.id);
    });
  }

  public async unloadAsync(
    ...modules: interfaces.ContainerModuleBase[]
  ): Promise<void> {
    for (const module of modules) {
      const deactivations: interfaces.Binding[] = this._removeModuleBindings(
        module.id,
      );
      await this._deactivateSingletonsAsync(deactivations);

      this._removeModuleHandlers(module.id);
    }
  }

  // Registers a type binding
  public bind<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): interfaces.BindingToSyntax<T> {
    return this._bind(this._buildBinding(serviceIdentifier));
  }

  public rebind<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): interfaces.BindingToSyntax<T> {
    this.unbind(serviceIdentifier);
    return this.bind(serviceIdentifier);
  }

  public async rebindAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): Promise<interfaces.BindingToSyntax<T>> {
    await this.unbindAsync(serviceIdentifier);
    return this.bind(serviceIdentifier);
  }

  // Removes a type binding from the registry by its key
  public unbind(serviceIdentifier: interfaces.ServiceIdentifier): void {
    if (this._bindingDictionary.hasKey(serviceIdentifier)) {
      const bindings: interfaces.Binding[]
        = this._bindingDictionary.get(serviceIdentifier);

      this._deactivateSingletons(bindings);
    }

    this._removeServiceFromDictionary(serviceIdentifier);
  }

  public async unbindAsync(
    serviceIdentifier: interfaces.ServiceIdentifier,
  ): Promise<void> {
    if (this._bindingDictionary.hasKey(serviceIdentifier)) {
      const bindings: interfaces.Binding[]
        = this._bindingDictionary.get(serviceIdentifier);

      await this._deactivateSingletonsAsync(bindings);
    }

    this._removeServiceFromDictionary(serviceIdentifier);
  }

  // Removes all the type bindings from the registry
  public unbindAll(): void {
    this._bindingDictionary.traverse(
      (_key: interfaces.ServiceIdentifier, value: interfaces.Binding[]) => {
        this._deactivateSingletons(value);
      },
    );

    this._bindingDictionary = new Lookup<Binding<unknown>>();
  }

  public async unbindAllAsync(): Promise<void> {
    const promises: Promise<void>[] = [];

    this._bindingDictionary.traverse(
      (_key: interfaces.ServiceIdentifier, value: interfaces.Binding[]) => {
        promises.push(this._deactivateSingletonsAsync(value));
      },
    );

    await Promise.all(promises);

    this._bindingDictionary = new Lookup<Binding<unknown>>();
  }

  public onActivation<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    onActivation: interfaces.BindingActivation<T>,
  ) {
    this._activations.add(
      serviceIdentifier,
      onActivation as interfaces.BindingActivation<unknown>,
    );
  }

  public onDeactivation<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    onDeactivation: interfaces.BindingDeactivation<T>,
  ) {
    this._deactivations.add(
      serviceIdentifier,
      onDeactivation as interfaces.BindingDeactivation<unknown>,
    );
  }

  // Allows to check if there are bindings available for serviceIdentifier
  public isBound(
    serviceIdentifier: interfaces.ServiceIdentifier<unknown>,
  ): boolean {
    let bound: boolean = this._bindingDictionary.hasKey(serviceIdentifier);
    if (!bound && this.parent) {
      bound = this.parent.isBound(serviceIdentifier);
    }
    return bound;
  }

  // check binding dependency only in current container
  public isCurrentBound<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): boolean {
    return this._bindingDictionary.hasKey(serviceIdentifier);
  }

  public isBoundNamed(
    serviceIdentifier: interfaces.ServiceIdentifier,
    named: string | number | symbol,
  ): boolean {
    return this.isBoundTagged(serviceIdentifier, METADATA_KEY.NAMED_TAG, named);
  }

  // Check if a binding with a complex constraint is available without throwing a error. Ancestors are also verified.
  public isBoundTagged(
    serviceIdentifier: interfaces.ServiceIdentifier,
    key: string | number | symbol,
    value: unknown,
  ): boolean {
    let bound: boolean = false;

    // verify if there are bindings available for serviceIdentifier on current binding dictionary
    if (this._bindingDictionary.hasKey(serviceIdentifier)) {
      const bindings: interfaces.Binding[]
        = this._bindingDictionary.get(serviceIdentifier);
      const request: interfaces.Request = createMockRequest(
        this,
        serviceIdentifier,
        {
          customTag: {
            key,
            value,
          },
          isMultiInject: false,
        },
      );
      bound = bindings.some((b: interfaces.Binding) => b.constraint(request));
    }

    // verify if there is a parent container that could solve the request
    if (!bound && this.parent) {
      bound = this.parent.isBoundTagged(serviceIdentifier, key, value);
    }

    return bound;
  }

  public snapshot(): void {
    this._snapshots.push(
      ContainerSnapshot.of(
        this._bindingDictionary.clone(),
        this._middleware,
        this._activations.clone(),
        this._deactivations.clone(),
        this._moduleActivationStore.clone(),
      ),
    );
  }

  public restore(): void {
    const snapshot: interfaces.ContainerSnapshot | undefined
      = this._snapshots.pop();
    if (snapshot === undefined) {
      throw new Error(ERROR_MSGS.NO_MORE_SNAPSHOTS_AVAILABLE);
    }
    this._bindingDictionary = snapshot.bindings;
    this._activations = snapshot.activations;
    this._deactivations = snapshot.deactivations;
    this._middleware = snapshot.middleware;
    this._moduleActivationStore = snapshot.moduleActivationStore;
  }

  public createChild(
    containerOptions?: interfaces.ContainerOptions,
  ): Container {
    const child: Container = new Container(containerOptions || this.options);
    child.parent = this;
    return child;
  }

  public applyMiddleware(...middlewares: interfaces.Middleware[]): void {
    const initial: interfaces.Next = this._middleware
      ? this._middleware
      : this._planAndResolve();
    this._middleware = middlewares.reduce(
      (prev: interfaces.Next, curr: interfaces.Middleware) => curr(prev),
      initial,
    );
  }

  public applyCustomMetadataReader(metadataReader: interfaces.MetadataReader) {
    this._metadataReader = metadataReader;
  }

  // Resolves a dependency by its runtime identifier
  // The runtime identifier must be associated with only one binding
  // use getAll when the runtime identifier is associated with multiple bindings
  public get<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      false,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T;
  }

  public async getAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): Promise<T> {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      false,
    );

    return this._get<T>(getArgs) as Promise<T> | T;
  }

  public getTagged<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): T {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      false,
      key,
      value,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T;
  }

  public async getTaggedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): Promise<T> {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      false,
      key,
      value,
    );

    return this._get<T>(getArgs) as Promise<T> | T;
  }

  public getNamed<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): T {
    return this.getTagged<T>(serviceIdentifier, METADATA_KEY.NAMED_TAG, named);
  }

  public async getNamedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): Promise<T> {
    return this.getTaggedAsync<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  // Resolves a dependency by its runtime identifier
  // The runtime identifier can be associated with one or multiple bindings
  public getAll<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    options?: interfaces.GetAllOptions,
  ): T[] {
    const getArgs: GetArgs<T> = this._getAllArgs(
      serviceIdentifier,
      options,
      false,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T[];
  }

  public async getAllAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    options?: interfaces.GetAllOptions,
  ): Promise<T[]> {
    const getArgs: GetArgs<T> = this._getAllArgs(
      serviceIdentifier,
      options,
      false,
    );

    return this._getAll(getArgs);
  }

  public getAllTagged<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): T[] {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      true,
      false,
      key,
      value,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T[];
  }

  public async getAllTaggedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): Promise<T[]> {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      true,
      false,
      key,
      value,
    );

    return this._getAll(getArgs);
  }

  public getAllNamed<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): T[] {
    return this.getAllTagged<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  public async getAllNamedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): Promise<T[]> {
    return this.getAllTaggedAsync<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  public resolve<T>(constructorFunction: interfaces.Newable<T>) {
    const isBound: boolean = this.isBound(constructorFunction);
    if (!isBound) {
      this.bind<T>(constructorFunction).toSelf();
    }
    const resolved: T = this.get<T>(constructorFunction);
    if (!isBound) {
      this.unbind(constructorFunction);
    }
    return resolved;
  }

  public tryGet<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): T | undefined {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      true,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T | undefined;
  }

  public async tryGetAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): Promise<T | undefined> {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      true,
    );

    return this._get<T>(getArgs) as Promise<T> | T | undefined;
  }

  public tryGetTagged<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): T | undefined {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      true,
      key,
      value,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T | undefined;
  }

  public async tryGetTaggedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): Promise<T | undefined> {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      false,
      true,
      key,
      value,
    );

    return this._get<T>(getArgs) as Promise<T> | T | undefined;
  }

  public tryGetNamed<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): T | undefined {
    return this.tryGetTagged<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  public async tryGetNamedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): Promise<T | undefined> {
    return this.tryGetTaggedAsync<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  public tryGetAll<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    options?: interfaces.GetAllOptions,
  ): T[] {
    const getArgs: GetArgs<T> = this._getAllArgs(
      serviceIdentifier,
      options,
      true,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T[];
  }

  public async tryGetAllAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    options?: interfaces.GetAllOptions,
  ): Promise<T[]> {
    const getArgs: GetArgs<T> = this._getAllArgs(
      serviceIdentifier,
      options,
      true,
    );

    return this._getAll(getArgs);
  }

  public tryGetAllTagged<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): T[] {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      true,
      true,
      key,
      value,
    );

    return this._getButThrowIfAsync<T>(getArgs) as T[];
  }

  public async tryGetAllTaggedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    key: string | number | symbol,
    value: unknown,
  ): Promise<T[]> {
    const getArgs: GetArgs<T> = this._getNotAllArgs(
      serviceIdentifier,
      true,
      true,
      key,
      value,
    );

    return this._getAll(getArgs);
  }

  public tryGetAllNamed<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): T[] {
    return this.tryGetAllTagged<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  public async tryGetAllNamedAsync<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    named: string | number | symbol,
  ): Promise<T[]> {
    return this.tryGetAllTaggedAsync<T>(
      serviceIdentifier,
      METADATA_KEY.NAMED_TAG,
      named,
    );
  }

  private _preDestroy(
    constructor: NewableFunction | undefined,
    instance: unknown,
  ): Promise<void> | void {
    if (
      constructor !== undefined
      && Reflect.hasMetadata(METADATA_KEY.PRE_DESTROY, constructor)
    ) {
      const data: interfaces.Metadata = Reflect.getMetadata(
        METADATA_KEY.PRE_DESTROY,
        constructor,
      ) as interfaces.Metadata;

      return (instance as interfaces.Instance<unknown>)[
        data.value as string
      ]?.();
    }
  }

  private _removeModuleHandlers(moduleId: number): void {
    const moduleActivationsHandlers: interfaces.ModuleActivationHandlers
      = this._moduleActivationStore.remove(moduleId);

    this._activations.removeIntersection(
      moduleActivationsHandlers.onActivations,
    );
    this._deactivations.removeIntersection(
      moduleActivationsHandlers.onDeactivations,
    );
  }

  private _removeModuleBindings(
    moduleId: number,
  ): interfaces.Binding<unknown>[] {
    return this._bindingDictionary.removeByCondition(
      (binding: interfaces.Binding) => binding.moduleId === moduleId,
    );
  }

  private _deactivate<T>(
    binding: Binding<T>,
    instance: T,
  ): void | Promise<void> {
    const constructor: NewableFunction | undefined
      = instance === undefined
        ? undefined
        : Object.getPrototypeOf(instance).constructor;

    try {
      if (this._deactivations.hasKey(binding.serviceIdentifier)) {
        const result: void | Promise<void> = this._deactivateContainer(
          instance,
          this._deactivations.get(binding.serviceIdentifier).values(),
        );

        if (isPromise(result)) {
          return this._handleDeactivationError(
            result.then(async () =>
              this._propagateContainerDeactivationThenBindingAndPreDestroyAsync(
                binding,
                instance,
                constructor,
              ),
            ),
            binding.serviceIdentifier,
          );
        }
      }

      const propagateDeactivationResult: void | Promise<void>
        = this._propagateContainerDeactivationThenBindingAndPreDestroy(
          binding,
          instance,
          constructor,
        );

      if (isPromise(propagateDeactivationResult)) {
        return this._handleDeactivationError(
          propagateDeactivationResult,
          binding.serviceIdentifier,
        );
      }
    }
    catch (ex) {
      if (ex instanceof Error) {
        throw new TypeError(
          ERROR_MSGS.ON_DEACTIVATION_ERROR(
            getServiceIdentifierAsString(binding.serviceIdentifier),
            ex.message,
          ),
        );
      }
    }
  }

  private async _handleDeactivationError(
    asyncResult: Promise<void>,
    serviceIdentifier: interfaces.ServiceIdentifier,
  ): Promise<void> {
    try {
      await asyncResult;
    }
    catch (ex) {
      if (ex instanceof Error) {
        throw new TypeError(
          ERROR_MSGS.ON_DEACTIVATION_ERROR(
            getServiceIdentifierAsString(serviceIdentifier),
            ex.message,
          ),
        );
      }
    }
  }

  private _deactivateContainer(
    instance: unknown,
    deactivationsIterator: IterableIterator<
      interfaces.BindingDeactivation<unknown>
    >,
  ): void | Promise<void> {
    let deactivation: IteratorResult<interfaces.BindingDeactivation>
      = deactivationsIterator.next();

    while (typeof deactivation.value === 'function') {
      const result: unknown = (
        deactivation.value as (instance: unknown) => void | Promise<void>
      )(instance);

      if (isPromise(result)) {
        return result.then(async () =>
          this._deactivateContainerAsync(instance, deactivationsIterator),
        );
      }

      deactivation = deactivationsIterator.next();
    }
  }

  private async _deactivateContainerAsync(
    instance: unknown,
    deactivationsIterator: IterableIterator<
      interfaces.BindingDeactivation<unknown>
    >,
  ): Promise<void> {
    let deactivation: IteratorResult<interfaces.BindingDeactivation>
      = deactivationsIterator.next();

    while (typeof deactivation.value === 'function') {
      await (deactivation.value as (instance: unknown) => Promise<void>)(
        instance,
      );
      deactivation = deactivationsIterator.next();
    }
  }

  private _getContainerModuleHelpersFactory() {
    const getBindFunction: (
      moduleId: interfaces.ContainerModuleBase['id'],
    ) => interfaces.Bind
      = (moduleId: interfaces.ContainerModuleBase['id']) =>
        <T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) => {
          const binding: Binding<T> = this._buildBinding(serviceIdentifier);
          binding.moduleId = moduleId;

          return this._bind(binding);
        };

    const getUnbindFunction: () => (
      serviceIdentifier: interfaces.ServiceIdentifier,
    ) => void = () => (serviceIdentifier: interfaces.ServiceIdentifier) => {
      this.unbind(serviceIdentifier);
    };

    const getUnbindAsyncFunction: () => (
      serviceIdentifier: interfaces.ServiceIdentifier,
    ) => Promise<void>
      = () =>
        async (
          serviceIdentifier: interfaces.ServiceIdentifier,
        ): Promise<void> => {
          return this.unbindAsync(serviceIdentifier);
        };

    const getIsboundFunction: () => (
      serviceIdentifier: interfaces.ServiceIdentifier,
    ) => boolean
      = () =>
        (serviceIdentifier: interfaces.ServiceIdentifier): boolean => {
          return this.isBound(serviceIdentifier);
        };

    const getRebindFunction: (
      moduleId: interfaces.ContainerModuleBase['id'],
    ) => interfaces.Rebind = (
      moduleId: interfaces.ContainerModuleBase['id'],
    ) => {
      const bind: interfaces.Bind = getBindFunction(moduleId);

      return <T = unknown>(
        serviceIdentifier: interfaces.ServiceIdentifier<T>,
      ) => {
        this.unbind(serviceIdentifier);
        return bind(serviceIdentifier);
      };
    };

    const getOnActivationFunction: (
      moduleId: interfaces.ContainerModuleBase['id'],
    ) => <T>(
      serviceIdentifier: interfaces.ServiceIdentifier<T>,
      onActivation: interfaces.BindingActivation<T>,
    ) => void
      = (moduleId: interfaces.ContainerModuleBase['id']) =>
        <T>(
          serviceIdentifier: interfaces.ServiceIdentifier<T>,
          onActivation: interfaces.BindingActivation<T>,
        ) => {
          this._moduleActivationStore.addActivation(
            moduleId,
            serviceIdentifier,
            onActivation,
          );
          this.onActivation(serviceIdentifier, onActivation);
        };

    const getOnDeactivationFunction: (
      moduleId: interfaces.ContainerModuleBase['id'],
    ) => <T>(
      serviceIdentifier: interfaces.ServiceIdentifier<T>,
      onDeactivation: interfaces.BindingDeactivation<T>,
    ) => void
      = (moduleId: interfaces.ContainerModuleBase['id']) =>
        <T>(
          serviceIdentifier: interfaces.ServiceIdentifier<T>,
          onDeactivation: interfaces.BindingDeactivation<T>,
        ) => {
          this._moduleActivationStore.addDeactivation(
            moduleId,
            serviceIdentifier,
            onDeactivation,
          );
          this.onDeactivation(serviceIdentifier, onDeactivation);
        };

    return (mId: interfaces.ContainerModuleBase['id']) => ({
      bindFunction: getBindFunction(mId),
      isboundFunction: getIsboundFunction(),
      onActivationFunction: getOnActivationFunction(mId),
      onDeactivationFunction: getOnDeactivationFunction(mId),
      rebindFunction: getRebindFunction(mId),
      unbindAsyncFunction: getUnbindAsyncFunction(),
      unbindFunction: getUnbindFunction(),
    });
  }

  private _bind<T>(binding: Binding<T>): BindingToSyntax<T> {
    this._bindingDictionary.add(
      binding.serviceIdentifier,
      binding as Binding<unknown>,
    );
    return new BindingToSyntax<T>(binding);
  }

  private _buildBinding<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
  ): Binding<T> {
    const scope: interfaces.BindingScope
      = this.options.defaultScope || BindingScopeEnum.Transient;
    return new Binding<T>(serviceIdentifier, scope);
  }

  private async _getAll<T>(getArgs: GetArgs<T>): Promise<T[]> {
    return Promise.all(this._get<T>(getArgs) as (Promise<T> | T)[]);
  }

  // Prepares arguments required for resolution and
  // delegates resolution to _middleware if available
  // otherwise it delegates resolution to _planAndResolve
  private _get<T>(getArgs: GetArgs<T>): interfaces.ContainerResolution<T> {
    const planAndResolveArgs: interfaces.NextArgs<T> = {
      ...getArgs,
      contextInterceptor: (context: interfaces.Context) => context,
      targetType: TargetTypeEnum.Variable,
    };
    //
    if (this._middleware) {
      const middlewareResult: unknown = this._middleware(planAndResolveArgs);
      if (middlewareResult === undefined || middlewareResult === null) {
        throw new Error(ERROR_MSGS.INVALID_MIDDLEWARE_RETURN);
      }
      return middlewareResult as interfaces.ContainerResolution<T>;
    }

    return this._planAndResolve<T>()(planAndResolveArgs);
  }

  private _getButThrowIfAsync<T>(getArgs: GetArgs<T>): undefined | T | T[] {
    const result: interfaces.ContainerResolution<T> = this._get<T>(getArgs);

    if (isPromiseOrContainsPromise<T>(result)) {
      throw new Error(ERROR_MSGS.LAZY_IN_SYNC(getArgs.serviceIdentifier));
    }

    return result as undefined | T | T[];
  }

  private _getAllArgs<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    options: interfaces.GetAllOptions | undefined,
    isOptional: boolean,
  ): GetArgs<T> {
    const getAllArgs: GetArgs<T> = {
      avoidConstraints: !(options?.enforceBindingConstraints ?? false),
      isMultiInject: true,
      isOptional,
      serviceIdentifier,
    };

    return getAllArgs;
  }

  private _getNotAllArgs<T>(
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    isMultiInject: boolean,
    isOptional: boolean,
    key?: string | number | symbol | undefined,
    value?: unknown,
  ): GetArgs<T> {
    const getNotAllArgs: GetArgs<T> = {
      avoidConstraints: false,
      isMultiInject,
      isOptional,
      key,
      serviceIdentifier,
      value,
    };

    return getNotAllArgs;
  }

  private _getPlanMetadataFromNextArgs(
    args: interfaces.NextArgs<unknown>,
  ): PlanMetadata {
    const planMetadata: PlanMetadata = {
      isMultiInject: args.isMultiInject,
    };

    if (args.key !== undefined) {
      planMetadata.customTag = {
        key: args.key,
        value: args.value,
      };
    }

    if (args.isOptional === true) {
      planMetadata.isOptional = true;
    }

    return planMetadata;
  }

  // Planner creates a plan and Resolver resolves a plan
  // one of the jobs of the Container is to links the Planner
  // with the Resolver and that is what this function is about
  private _planAndResolve<T = unknown>(): (
  args: interfaces.NextArgs<T>,
  ) => interfaces.ContainerResolution<T> {
    return (
      args: interfaces.NextArgs<T>,
    ): T | Promise<T> | (T | Promise<T>)[] => {
      // create a plan
      let context: interfaces.Context = plan(
        this._metadataReader,
        this,
        args.targetType,
        args.serviceIdentifier,
        this._getPlanMetadataFromNextArgs(args),
        args.avoidConstraints,
      );

      // apply context interceptor
      context = args.contextInterceptor(context);

      // resolve plan
      const result: T | Promise<T> | (T | Promise<T>)[] = resolve<T>(context);

      return result;
    };
  }

  private _deactivateIfSingleton(
    binding: Binding<unknown>,
  ): Promise<void> | void {
    if (!binding.activated) {
      return;
    }

    if (isPromise(binding.cache)) {
      return binding.cache.then((resolved: unknown): void | Promise<void> =>
        this._deactivate(binding, resolved),
      );
    }

    return this._deactivate(binding, binding.cache);
  }

  private _deactivateSingletons(bindings: Binding<unknown>[]): void {
    for (const binding of bindings) {
      const result: void | Promise<void> = this._deactivateIfSingleton(binding);

      if (isPromise(result)) {
        throw new Error(ERROR_MSGS.ASYNC_UNBIND_REQUIRED);
      }
    }
  }

  private async _deactivateSingletonsAsync(
    bindings: Binding<unknown>[],
  ): Promise<void> {
    await Promise.all(
      bindings.map(
        async (b: interfaces.Binding): Promise<void> =>
          this._deactivateIfSingleton(b),
      ),
    );
  }

  private _propagateContainerDeactivationThenBindingAndPreDestroy<T>(
    binding: Binding<T>,
    instance: T,
    constructor: NewableFunction | undefined,
  ): void | Promise<void> {
    if (this.parent) {
      return this._deactivate.bind(this.parent)(binding, instance);
    }
    else {
      return this._bindingDeactivationAndPreDestroy(
        binding,
        instance,
        constructor,
      );
    }
  }

  private async _propagateContainerDeactivationThenBindingAndPreDestroyAsync<T>(
    binding: Binding<T>,
    instance: T,
    constructor: NewableFunction | undefined,
  ): Promise<void> {
    if (this.parent) {
      await this._deactivate.bind(this.parent)(binding, instance);
    }
    else {
      await this._bindingDeactivationAndPreDestroyAsync(
        binding,
        instance,
        constructor,
      );
    }
  }

  private _removeServiceFromDictionary(
    serviceIdentifier: interfaces.ServiceIdentifier,
  ): void {
    try {
      this._bindingDictionary.remove(serviceIdentifier);
    }
    catch (_e: unknown) {
      throw new Error(
        `${ERROR_MSGS.CANNOT_UNBIND} ${getServiceIdentifierAsString(serviceIdentifier)}`,
      );
    }
  }

  private _bindingDeactivationAndPreDestroy<T>(
    binding: Binding<T>,
    instance: T,
    constructor: NewableFunction | undefined,
  ): void | Promise<void> {
    if (typeof binding.onDeactivation === 'function') {
      const result: void | Promise<void> = binding.onDeactivation(instance);

      if (isPromise(result)) {
        return result.then((): void | Promise<void> =>
          this._preDestroy(constructor, instance),
        );
      }
    }

    return this._preDestroy(constructor, instance);
  }

  private async _bindingDeactivationAndPreDestroyAsync<T>(
    binding: Binding<T>,
    instance: T,
    constructor: NewableFunction | undefined,
  ): Promise<void> {
    if (typeof binding.onDeactivation === 'function') {
      await binding.onDeactivation(instance);
    }

    await this._preDestroy(constructor, instance);
  }
}

export { Container };
