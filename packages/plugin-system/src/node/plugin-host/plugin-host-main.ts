import { ServiceContainer } from '@gepick/core/common';
import { IPluginManagerExt, PluginHostContext } from '@gepick/plugin-system/common';
import { PluginApiModule } from './plugin-host-module';
import { IPluginHostRpcService } from './plugin-host-rpc';

function startPluginHostProcess() {
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
    console.error(err.stack);
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

  const serviceContainer = new ServiceContainer();

  serviceContainer.loadModules([
    PluginApiModule,
  ]);

  const pluginHostRpcService = serviceContainer.get<IPluginHostRpcService>(IPluginHostRpcService)
  const pluginManagerExt = serviceContainer.get<IPluginManagerExt>(IPluginManagerExt)

  pluginHostRpcService.set(PluginHostContext.PluginManager, pluginManagerExt)

  // 当前子进程接收到父进程传递过来的消息时会触发message事件
  process.on('message', (message: any) => {
    try {
      // NOTE： 当父进程发送过来消息的时候，将消息通过emitter发送出去 @1
      pluginHostRpcService.dispatchAction(JSON.parse(message));
    }
    catch (e) {
      console.error(e);
    }
  });

  // eslint-disable-next-line no-console
  console.log(`PLUGIN_HOST(${process.pid}) starting instance`);
}

startPluginHostProcess()
