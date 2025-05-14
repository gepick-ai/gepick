import { DisposableCollection, IContributionProvider, IDisposable, InjectableService, MaybePromise, URI, createContribution, createServiceDecorator, toDisposable } from "@gepick/core/common";
import { CommandIdVariables } from "@gepick/variable-resolver/common";

/**
 * Variable can be used inside of strings using ${variableName} syntax.
 */
export interface Variable {

  /**
     * A unique name of this variable.
     */
  readonly name: string;

  /**
     * A human-readable description of this variable.
     */
  readonly description?: string;

  /**
     * Resolve to a string value of this variable or
     * `undefined` if variable cannot be resolved.
     * Never reject.
     */
  resolve(
    context?: URI,
    argument?: string,
    configurationSection?: string,
    commandIdVariables?: CommandIdVariables,
    configuration?: unknown
  ): MaybePromise<any>;
}

export const VariableContribution = Symbol('VariableContribution');
/**
 * The variable contribution should be implemented to register custom variables.
 */
export interface VariableContribution {
  registerVariables(variables: VariableRegistry): void;
}

export const [IVariableContribution, IVariableContributionProvider] = createContribution<IVariableContribution>("VariableContribution");
export type IVariableContribution = VariableContribution;
export interface IVariableContributionProvider extends IContributionProvider<IVariableContribution> {}

/**
 * The variable registry manages variables.
 */
export class VariableRegistry extends InjectableService {
  protected readonly variables: Map<string, Variable> = new Map();
  protected readonly toDispose = new DisposableCollection();

  override dispose(): void {
    this.toDispose.dispose();
    super.dispose();
  }

  /**
     * Register the given variable.
     * Do nothing if a variable is already registered for the given variable name.
     */
  registerVariable(variable: Variable): IDisposable {
    if (this.variables.has(variable.name)) {
      console.warn(`A variables with name ${variable.name} is already registered.`);
      return toDisposable(() => {});
    }
    this.variables.set(variable.name, variable);
    const disposable = {
      dispose: () => this.variables.delete(variable.name),
    };
    this.toDispose.push(disposable);
    return disposable;
  }

  /**
     * Return all registered variables.
     */
  getVariables(): Variable[] {
    return [...this.variables.values()];
  }

  /**
     * Get a variable for the given name or `undefined` if none.
     */
  getVariable(name: string): Variable | undefined {
    return this.variables.get(name);
  }

  /**
     * Register an array of variables.
     * Do nothing if a variable is already registered for the given variable name.
     */
  registerVariables(variables: Variable[]): IDisposable[] {
    return variables.map(v => this.registerVariable(v));
  }
}

export const IVariableRegistry = createServiceDecorator<IVariableRegistry>(VariableRegistry.name);
export type IVariableRegistry = VariableRegistry;
