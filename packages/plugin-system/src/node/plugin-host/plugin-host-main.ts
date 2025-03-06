/* eslint-disable ts/no-empty-object-type */
import { createRequire } from 'module';
import { EXT, Emitter, RPCProtocol } from '@gepick/plugin-system/common';
import { PluginManagerExt, createPluginAPI } from '@gepick/plugin-system/node';

// eslint-disable-next-line no-console
console.log(`PLUGIN_HOST(${process.pid}) starting instance`);

// override exit() function, to do not allow plugin kill this node
process.exit = function (_code?: number): void {
  const err = new Error('An plugin call process.exit() and it was prevented.');
  console.warn(err.stack);
} as (code?: number) => never;

// same for 'crash'(works only in electron)
const proc = process as any;
if (proc.crash) {
  proc.crash = function (): void {
    const err = new Error('An plugin call process.crash() and it was prevented.');
    console.warn(err.stack);
  };
}

process.on('uncaughtException', (err: Error) => {
  console.error(err);
});

const unhandledPromises: Promise<any>[] = [];

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  unhandledPromises.push(promise);
  setTimeout(() => {
    const index = unhandledPromises.indexOf(promise);
    if (index >= 0) {
      promise.catch((err) => {
        unhandledPromises.splice(index, 1);

        console.error(`Promise rejection not handled in one second: ${err} , reason: ${reason}`);
        if (err && err.stack) {
          console.error(`With stack trace: ${err.stack}`);
        }
      });
    }
  }, 1000);
});

process.on('rejectionHandled', (promise: Promise<any>) => {
  const index = unhandledPromises.indexOf(promise);
  if (index >= 0) {
    unhandledPromises.splice(index, 1);
  }
});

const plugins = new Map<string, () => void>();
const emitter = new Emitter<{}>();
const rpc = new RPCProtocol({
  onMessage: emitter.event,
  send: (m: {}) => {
    if (process.send) {
      process.send(JSON.stringify(m));
    }
  },
});

// 当前子进程接收到父进程传递过来的消息时会触发message事件
process.on('message', (message: any) => {
  try {
    // NOTE： 当父进程发送过来消息的时候，将消息通过emitter发送出去 @1
    emitter.fire(JSON.parse(message));
  }
  catch (e) {
    console.error(e);
  }
});

function setupPluginRuntime(rpc: any) {
  const pluginAPI = createPluginAPI(rpc);
  const require = createRequire(import.meta.url);
  const NODE_MODULE_NAMES = ['@gepick/plugin-api'];
  const module = require('module');

  // add theia object as module into npm cache
  NODE_MODULE_NAMES.forEach((moduleName) => {
    require.cache[moduleName] = {
      id: moduleName,
      filename: moduleName,
      loaded: true,
      exports: pluginAPI,
    } as any;
  });

  // save original resolve method
  const internalResolve = module._resolveFilename;

  // if we try to resolve theia module, return the filename entry to use cache.
  module._resolveFilename = (request: string, parent: {}) => {
    if (NODE_MODULE_NAMES.includes(request)) {
      return request;
    }
    const retVal = internalResolve(request, parent);
    return retVal;
  };
}

rpc.set(EXT.PLUGIN_MANAGER, new PluginManagerExt({
  initialize(_contextPath: string, _pluginMetadata: any): void {
    setupPluginRuntime(rpc);
  },
  async loadPlugin(_contextPath: string, plugin: any): Promise<void> {
    try {
      // debug
      plugin.pluginPath = "/Users/work/Projects/demo/.gepick/plugin-a/src/index.js"

      const pluginModule = await import(plugin.pluginPath);
      const pluginMain = pluginModule.default || pluginModule

      // ===startPlugin(plugin, pluginMain, plugins) block-start

      // if (typeof pluginMain[plugin.lifecycle.startMethod] === 'function') {
      pluginMain['activate' as any].apply(globalThis, []);
      // }
      // else {
      //   console.log('there is no doStart method on plugin');
      // }

      // if (typeof pluginMain[plugin.lifecycle.stopMethod] === 'function') {
      //   const pluginId = getPluginId(plugin.model);
      //   plugins.set(pluginId, pluginMain[plugin.lifecycle.stopMethod]);
      // }

      // ===startPlugin(plugin, pluginMain, plugins) block-end
    }
    catch (e: any) {
      console.error(e.stack);
    }
  },
  stopPlugins(_contextPath: string, pluginIds: string[]): void {
    pluginIds.forEach((pluginId) => {
      const stopPluginMethod = plugins.get(pluginId);
      if (stopPluginMethod) {
        stopPluginMethod();
        plugins.delete(pluginId);
      }
    });
  },
}));
