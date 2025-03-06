/**
 * 设计plugin-api后，用户只需要引入plugin-api包，即可使用所有的api。
 * 虽然我们只设计了plugin-api的定义，但是我们可以通过实现plugin-api的定义，来实现plugin-api的功能。
 * 由于我们的应用有个环节要做的事情是引入所有plugin，然后激活plugin。因此我们可以在这个环节实现plugin-api的定义。
 * 我们读取对应plugin的代码内容，在执行起这份代码的时候，通过修改node:module的load方法，来完成plugin-api的功能返回，
 * 无需担心在实际执行的时候plugin-api没有定义。
 *
 * 第三方实现一个plugin的流程：
 * 1、引入plugin-api包
 * 2、利用plugin-api暴露的api，实现自己的plugin
 *
 * 第三方实现的plugin和主应用之间的协议，如何激活plugin？
 *
 * 主应用run一个plugin的运行流程：
 * 1. 读取plugin的代码内容
 * 2. 执行plugin的代码内容（执行其activate）
 */

declare module "@gepick/plugin-api" {

  export class Disposable {
    constructor(func: () => void);
    /**
     * Dispose this object.
     */
    dispose(): void;

    static create(func: () => void): Disposable;
  }

  /**
   * A command is a unique identifier of a function
   * which can be executed by a user via a keyboard shortcut,
   * a menu action or directly.
   */
  export interface Command {
    /**
     * A unique identifier of this command.
     */
    id: string
    /**
     * A label of this command.
     */
    label?: string
    /**
     * An icon class of this command.
     */
    iconClass?: string
  }

  /**
   * Namespace for dealing with commands. In short, a command is a function with a
   * unique identifier. The function is sometimes also called _command handler_.
   *
   * Commands can be added using the [registerCommand](#commands.registerCommand) and
   * [registerTextEditorCommand](#commands.registerTextEditorCommand) functions.
   * Registration can be split in two step: first register command without handler,
   * second register handler by command id.
   *
   * Any contributed command are available to any plugin, command can be invoked
   * by [executeCommand](#commands.executeCommand) function.
   *
   * Simple example that register command:
   * ```javascript
   * theia.commands.registerCommand({id:'say.hello.command'}, ()=>{
   *     console.log("Hello World!");
   * });
   * ```
   *
   * Simple example that invoke command:
   *
   * ```javascript
   * theia.commands.executeCommand('core.about');
   * ```
   */
  export namespace commands {
    /**
     * Register the given command and handler if present.
     *
     * Throw if a command is already registered for the given command identifier.
     */
    export function registerCommand(command: Command, handler?: (...args: any[]) => any): Disposable;

    /**
     * Register the given handler for the given command identifier.
     *
     * @param commandId a given command id
     * @param handler a command handler
     */
    export function registerHandler(commandId: string, handler: (...args: any[]) => any): Disposable;

    /**
     * Execute the active handler for the given command and arguments.
     *
     * Reject if a command cannot be executed.
     */
    export function executeCommand<T>(commandId: string, ...args: any[]): PromiseLike<T | undefined>;
  }
}
