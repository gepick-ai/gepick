import cp from "node:child_process";
import path from "node:path";
import { InjectableService, createServiceDecorator } from "@gepick/core/common";

export const IPluginHostProcessManager = createServiceDecorator<IPluginHostProcessManager>("PluginHostProcessManager");
/**
 * 负责plugin host process的相关操作
 */
export interface IPluginHostProcessManager {
  startPluginHostProcess: () => Promise<void>;
  stopPluginHostProcess: () => Promise<void>;
  getPluginHostProcess: () => cp.ChildProcess | undefined;
}

export class PluginHostProcessManager extends InjectableService implements IPluginHostProcessManager {
  private static pluginHostMainPath = path.resolve(__dirname, '../plugin-host/plugin-host-main');

  private pluginHostProcess: cp.ChildProcess | undefined;

  async startPluginHostProcess(): Promise<void> {
    if (this.pluginHostProcess) {
      this.stopPluginHostProcess();
    }

    this.pluginHostProcess = this.forkPluginHostProcess({
      serverName: "hosted-plugin",
      args: [],
    });

    //   this.pluginHostProcess.on('message', (message: string) => {
    //     if (this.client) {
    //       this.client.onMessage(message);
    //     }
    //   });

    return Promise.resolve();
  }

  async stopPluginHostProcess(): Promise<void> {

  }

  getPluginHostProcess(): cp.ChildProcess | undefined {
    return this.pluginHostProcess;
  }

  private forkPluginHostProcess(options: any): cp.ChildProcess {
    const forkOptions: cp.ForkOptions = {
      silent: true,
      execArgv: [
        "--import=./scripts/register.js",
        "--es-module-specifier-resolution=node",
      ],
      // 5th element MUST be 'overlapped' for it to work properly on Windows.
      // 'overlapped' works just like 'pipe' on non-Windows platforms.
      // See: https://nodejs.org/docs/latest-v14.x/api/child_process.html#child_process_options_stdio
      // Note: For some reason `@types/node` does not know about 'overlapped'.
      stdio: ['pipe', 'pipe', 'pipe', 'ipc', 'overlapped' as 'pipe'],
    };

    const inspectArgPrefix = `--${options.serverName}-inspect`;
    const inspectArg = process.argv.find(v => v.startsWith(inspectArgPrefix));
    if (inspectArg !== undefined) {
      forkOptions.execArgv = ['--nolazy', `--inspect${inspectArg.substr(inspectArgPrefix.length)}`];
    }

    const childProcess = cp.fork(PluginHostProcessManager.pluginHostMainPath, options.args, forkOptions);

    return childProcess;
  }
}
