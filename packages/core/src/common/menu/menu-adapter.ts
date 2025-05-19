import { ICommandRegistry } from '../command';
import { IDisposable, toDisposable } from '../lifecycle';
import { InjectableService, createServiceDecorator } from '../framework';
import { MenuPath } from './menu-types';

export type MenuCommandArguments = [menuPath: MenuPath, command: string, ...commandArgs: unknown[]];

export const MenuCommandExecutor = Symbol('MenuCommandExecutor');
export interface MenuCommandExecutor {
  isVisible: (...args: MenuCommandArguments) => boolean;
  isEnabled: (...args: MenuCommandArguments) => boolean;
  isToggled: (...args: MenuCommandArguments) => boolean;
  executeCommand: (...args: MenuCommandArguments) => Promise<unknown>;
};

export const MenuCommandAdapter = Symbol('MenuCommandAdapter');
export interface MenuCommandAdapter extends MenuCommandExecutor {
  /** Return values less than or equal to 0 are treated as rejections. */
  canHandle: (...args: MenuCommandArguments) => number;
}

export const MenuCommandAdapterRegistry = Symbol('MenuCommandAdapterRegistry');
export interface MenuCommandAdapterRegistry {
  registerAdapter: (adapter: MenuCommandAdapter) => IDisposable;
  getAdapterFor: (...args: MenuCommandArguments) => MenuCommandAdapter | undefined;
}

export class MenuCommandAdapterRegistryImpl extends InjectableService implements MenuCommandAdapterRegistry {
  protected readonly adapters = new Array<MenuCommandAdapter>();

  registerAdapter(adapter: MenuCommandAdapter): IDisposable {
    if (!this.adapters.includes(adapter)) {
      this.adapters.push(adapter);
      return toDisposable(() => {
        const index = this.adapters.indexOf(adapter);
        if (index !== -1) {
          this.adapters.splice(index, 1);
        }
      });
    }
    return toDisposable(() => {});
  }

  getAdapterFor(menuPath: MenuPath, command: string, ...commandArgs: unknown[]): MenuCommandAdapter | undefined {
    let bestAdapter: MenuCommandAdapter | undefined;
    let bestScore = 0;
    let currentScore = 0;
    for (const adapter of this.adapters) {
      // Greater than or equal: favor later registrations over earlier.
      // eslint-disable-next-line no-cond-assign
      if ((currentScore = adapter.canHandle(menuPath, command, ...commandArgs)) >= bestScore) {
        bestScore = currentScore;
        bestAdapter = adapter;
      }
    }
    return bestAdapter;
  }
}
export const IMenuCommandAdapterRegistry = createServiceDecorator<IMenuCommandAdapterRegistry>(MenuCommandAdapterRegistryImpl.name);
export type IMenuCommandAdapterRegistry = MenuCommandAdapterRegistryImpl;

export class MenuCommandExecutorImpl extends InjectableService implements MenuCommandExecutor {
  @IMenuCommandAdapterRegistry protected readonly adapterRegistry: IMenuCommandAdapterRegistry;
  @ICommandRegistry protected readonly commandRegistry: ICommandRegistry;

  executeCommand(menuPath: MenuPath, command: string, ...commandArgs: unknown[]): Promise<unknown> {
    return this.delegate(menuPath, command, commandArgs, 'executeCommand');
  }

  isVisible(menuPath: MenuPath, command: string, ...commandArgs: unknown[]): boolean {
    return this.delegate(menuPath, command, commandArgs, 'isVisible');
  }

  isEnabled(menuPath: MenuPath, command: string, ...commandArgs: unknown[]): boolean {
    return this.delegate(menuPath, command, commandArgs, 'isEnabled');
  }

  isToggled(menuPath: MenuPath, command: string, ...commandArgs: unknown[]): boolean {
    return this.delegate(menuPath, command, commandArgs, 'isToggled');
  }

  protected delegate<T extends keyof MenuCommandExecutor>(menuPath: MenuPath, command: string, commandArgs: unknown[], method: T): ReturnType<MenuCommandExecutor[T]> {
    const adapter = this.adapterRegistry.getAdapterFor(menuPath, command, commandArgs);
    return (adapter
      ? adapter[method](menuPath, command, ...commandArgs)
      : this.commandRegistry[method](command, ...commandArgs)) as ReturnType<MenuCommandExecutor[T]>;
  }
}
export const IMenuCommandExecutor = createServiceDecorator<IMenuCommandExecutor>(MenuCommandExecutorImpl.name);
export type IMenuCommandExecutor = MenuCommandExecutorImpl;
