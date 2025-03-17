import { createRequire } from "node:module";
import gepick from "@gepick/plugin-api";
import { IDisposable, IServiceContainer, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { ICommandRegistryExt } from "../../common/plugin-api/command-registry";

export class PluginHostApiService extends InjectableService {
  constructor(
    @IServiceContainer private readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  initialize() {
    const pluginAPI = this.createPluginApi();
    const NODE_MODULE_NAMES = ['@gepick/plugin-api'];

    this.interceptNodeModuleRequire(NODE_MODULE_NAMES, pluginAPI)
  }

  createPluginApi(): typeof gepick {
    const commandRegistryExt = this.serviceContainer.get<ICommandRegistryExt>(ICommandRegistryExt);

    const commands: typeof gepick.commands = {
      registerCommand(command: gepick.Command, handler?: <T>(...args: any[]) => T | PromiseLike<T>): IDisposable {
        return commandRegistryExt.registerCommand(command, handler)
      },
      executeCommand<T>(commandId: string, ...args: any[]): PromiseLike<T | undefined> {
        return commandRegistryExt.executeCommand(commandId, args)
      },
      registerHandler(commandId: string, handler: (...args: any[]) => any): IDisposable {
        return commandRegistryExt.registerHandler(commandId, handler)
      },
    }

    return <typeof gepick>{
      commands,
    }
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

export const IPluginHostApiService = createServiceDecorator<IPluginHostApiService>("PluginHostApiService");
export type IPluginHostApiService = PluginHostApiService
