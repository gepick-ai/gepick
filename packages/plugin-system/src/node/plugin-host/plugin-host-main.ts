import { InjectableService, ServiceContainer } from '@gepick/core/common';
import { PluginApiModule } from './plugin-host-module';
import { IPluginHostRpcService } from './plugin-host-rpc';
import { IPluginHostApiService } from './plugin-host-api';

function patchProcess() {
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
}

function handleProcessException() {
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

  process.on('uncaughtException', (err: Error) => {
    console.error(err.stack);
  });

  process.on('rejectionHandled', (promise: Promise<any>) => {
    const index = unhandledPromises.indexOf(promise);
    if (index >= 0) {
      unhandledPromises.splice(index, 1);
    }
  });
}

async function startPluginHostProcess() {
  handleProcessException();
  patchProcess();

  const serviceContainer = new ServiceContainer();

  serviceContainer.loadModules([
    PluginApiModule,
  ]);

  const pluginHostRpcService = serviceContainer.get<IPluginHostRpcService>(IPluginHostRpcService);
  const pluginHostApiService = serviceContainer.get<IPluginHostApiService>(IPluginHostApiService)
  // 完成rpc service的初始化工作后才能接着完成@gepick/plugin-api的重写工作
  await pluginHostRpcService.listenMessage();
  pluginHostApiService.initialize();

  // eslint-disable-next-line no-console
  console.log(`PLUGIN_HOST(${process.pid}) starting instance`);
}

startPluginHostProcess()
