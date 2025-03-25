import { createRequire } from "node:module";
import gepick from "@gepick/plugin-api";
import { IDisposable, IServiceContainer, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { ICommandRegistryExt } from "../../common/plugin-api/command-registry";

export interface IPluginApiRuntimeService {
  /**
   * 为plugin准备plugin api运行时
   */
  setupPluginApiRuntime: () => void;
}

export const IPluginApiRuntimeService = createServiceDecorator<IPluginApiRuntimeService>("PluginApiService");

export class PluginApiRuntimeService extends InjectableService implements IPluginApiRuntimeService {
  constructor(
    @IServiceContainer private readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  setupPluginApiRuntime(): void {
    const pluginApi = this.createPluginApi();
    const moduleNames = ['@gepick/plugin-api'];

    this.interceptNodeModuleRequire(moduleNames, pluginApi);
  }

  private createPluginApi(): typeof gepick {
    const commandRegistryExt = this.serviceContainer.get<ICommandRegistryExt>(ICommandRegistryExt);

    const commands: typeof gepick.commands = {
      registerCommand(command: gepick.Command, handler?: <T>(...args: any[]) => T | PromiseLike<T>): IDisposable {
        return commandRegistryExt.registerCommand(command, handler);
      },
      executeCommand<T>(commandId: string, ...args: any[]): PromiseLike<T | undefined> {
        return commandRegistryExt.executeCommand(commandId, args);
      },
      registerHandler(commandId: string, handler: (...args: any[]) => any): IDisposable {
        return commandRegistryExt.registerHandler(commandId, handler);
      },
    };

    return <typeof gepick>{
      commands,
    };
  }

  private interceptNodeModuleRequire(moduleNames: string[], exports: any) {
    const require = createRequire(import.meta.url);
    const module = require('module');

    // add gepick object as module into npm cache
    moduleNames.forEach((moduleName) => {
      require.cache[moduleName] = {
        id: moduleName,
        filename: moduleName,
        loaded: true,
        exports,
      } as any;
    });

    // save original resolve method
    const internalResolve = module._resolveFilename;

    // if we try to resolve gepick module, return the filename entry to use cache.
    module._resolveFilename = (request: string, parent: any) => {
      if (moduleNames.includes(request)) {
        return request;
      }
      const retVal = internalResolve(request, parent);
      return retVal;
    };
  }
}
