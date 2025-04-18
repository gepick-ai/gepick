import { interfaces } from '../interfaces/interfaces';
import { Lookup } from './lookup';

export class ModuleActivationStore implements interfaces.ModuleActivationStore {
  private readonly _map: Map<number, interfaces.ModuleActivationHandlers> =
    new Map();

  public remove(moduleId: number): interfaces.ModuleActivationHandlers {
    const handlers: interfaces.ModuleActivationHandlers | undefined =
      this._map.get(moduleId);

    if (handlers === undefined) {
      return this._getEmptyHandlersStore();
    }

    this._map.delete(moduleId);

    return handlers;
  }

  public addDeactivation<T>(
    moduleId: number,
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    onDeactivation: interfaces.BindingDeactivation<T>,
  ) {
    this._getModuleActivationHandlers(moduleId).onDeactivations.add(
      serviceIdentifier,
      onDeactivation as interfaces.BindingDeactivation<unknown>,
    );
  }

  public addActivation<T>(
    moduleId: number,
    serviceIdentifier: interfaces.ServiceIdentifier<T>,
    onActivation: interfaces.BindingActivation<T>,
  ) {
    this._getModuleActivationHandlers(moduleId).onActivations.add(
      serviceIdentifier,
      onActivation as interfaces.BindingActivation<unknown>,
    );
  }

  public clone(): interfaces.ModuleActivationStore {
    const clone: ModuleActivationStore = new ModuleActivationStore();

    this._map.forEach(
      (
        handlersStore: interfaces.ModuleActivationHandlers,
        moduleId: number,
      ) => {
        clone._map.set(moduleId, {
          onActivations: handlersStore.onActivations.clone(),
          onDeactivations: handlersStore.onDeactivations.clone(),
        });
      },
    );

    return clone;
  }

  private _getModuleActivationHandlers(
    moduleId: number,
  ): interfaces.ModuleActivationHandlers {
    let moduleActivationHandlers:
      | interfaces.ModuleActivationHandlers
      | undefined = this._map.get(moduleId);

    if (moduleActivationHandlers === undefined) {
      moduleActivationHandlers = this._getEmptyHandlersStore();
      this._map.set(moduleId, moduleActivationHandlers);
    }

    return moduleActivationHandlers;
  }

  private _getEmptyHandlersStore(): interfaces.ModuleActivationHandlers {
    const handlersStore: interfaces.ModuleActivationHandlers = {
      onActivations: new Lookup(),
      onDeactivations: new Lookup(),
    };
    return handlersStore;
  }
}
