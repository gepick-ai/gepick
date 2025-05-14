import { InjectableService, MaybeArray, OS, Optional, RecursivePartial, URI, cancelled, createServiceDecorator } from "@gepick/core/common";
import { IPreferencesService } from "@gepick/core/browser";
import { VariableInput } from "./variable-input";
import { VariableContribution, VariableRegistry } from "./variable";

// TODO(@jaylenchen): 补充相关模块后替换这里为相关缺失模块的具体定义
export const IEnvVariablesServer = createServiceDecorator<IEnvVariablesServer>("EnvVariablesServer");
export type IEnvVariablesServer = any;
export const ICommandService = createServiceDecorator<ICommandService>("CommandService");
export type ICommandService = any;
export const IResourceContextKey = createServiceDecorator<IResourceContextKey>("ResourceContextKey");
export type IResourceContextKey = any;
export const IQuickInputService = createServiceDecorator<IQuickInputService>("QuickInputService");
export type IQuickInputService = any;
export const IApplicationServer = createServiceDecorator<IApplicationServer>("ApplicationServer");
export type IApplicationServer = any;
export type QuickPickValue<T> = any;

export class CommonVariableContribution extends InjectableService implements VariableContribution {
  constructor(
    @IEnvVariablesServer protected readonly env: IEnvVariablesServer,
    @ICommandService protected readonly commands: ICommandService,
    @IPreferencesService protected readonly preferences: IPreferencesService,
    @IResourceContextKey protected readonly resourceContextKey: IResourceContextKey,
    @Optional() @IQuickInputService protected readonly quickInputService: IQuickInputService,
    @IApplicationServer protected readonly appServer: IApplicationServer,
  ) {
    super();
  }

  async registerVariables(variables: VariableRegistry): Promise<void> {
    const execPath = await this.env.getExecPath();
    variables.registerVariable({
      name: 'execPath',
      resolve: () => execPath,
    });
    variables.registerVariable({
      name: 'pathSeparator',
      resolve: () => OS.backend.isWindows ? '\\' : '/',
    });
    variables.registerVariable({
      name: 'env',
      resolve: async (_, envVariableName) => {
        const envVariable = envVariableName && await this.env.getValue(envVariableName);
        const envValue = envVariable && envVariable.value;
        return envValue || '';
      },
    });
    variables.registerVariable({
      name: 'config',
      resolve: (resourceUri = new URI(this.resourceContextKey.get()), preferenceName) => {
        if (!preferenceName) {
          return undefined;
        }
        return this.preferences.get(preferenceName, undefined, resourceUri && resourceUri.toString());
      },
    });
    variables.registerVariable({
      name: 'command',
      resolve: async (contextUri, commandId, configurationSection, commandIdVariables, configuration) => {
        if (commandId) {
          if (commandIdVariables?.[commandId]) {
            commandId = commandIdVariables[commandId];
          }
          const result = await this.commands.executeCommand(commandId, configuration);
          if (result === null) {
            throw cancelled();
          }
          return result;
        }
      },
    });
    variables.registerVariable({
      name: 'input',
      resolve: async (resourceUri = new URI(this.resourceContextKey.get()), variable, section) => {
        if (!variable || !section) {
          return undefined;
        }
        const configuration = this.preferences.get<RecursivePartial<{ inputs: MaybeArray<VariableInput> }>>(section, undefined, resourceUri && resourceUri.toString());
        const inputs = !!configuration && 'inputs' in configuration ? configuration.inputs : undefined;
        const input = Array.isArray(inputs) && inputs.find(item => !!item && item.id === variable);
        if (!input) {
          return undefined;
        }
        if (input.type === 'promptString') {
          if (typeof input.description !== 'string') {
            return undefined;
          }
          return this.quickInputService?.input({
            prompt: input.description,
            value: input.default,
          });
        }
        if (input.type === 'pickString') {
          if (typeof input.description !== 'string' || !Array.isArray(input.options)) {
            return undefined;
          }
          const elements: Array<QuickPickValue<string>> = [];
          for (const option of input.options) {
            if (typeof option !== 'string') {
              return undefined;
            }
            if (option === input.default) {
              elements.unshift({
                description: 'Default',
                label: option,
                value: option,
              });
            }
            else {
              elements.push({
                label: option,
                value: option,
              });
            }
          }
          const selectedPick = await this.quickInputService?.showQuickPick(elements, { placeholder: input.description });
          return selectedPick?.value;
        }
        if (input.type === 'command') {
          if (typeof input.command !== 'string') {
            return undefined;
          }
          return this.commands.executeCommand(input.command, input.args);
        }
        return undefined;
      },
    });
  }
}
