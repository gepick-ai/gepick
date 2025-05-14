import { Emitter, Event, IDisposable, InjectableService, MaybePromise, Prioritizeable, createServiceDecorator, toDisposable } from "@gepick/core/common";
import * as monaco from '@theia/monaco-editor-core';
import { PromptText } from "../prompt-text";
import { IAIVariableContributionProvider } from "./variable-contribution";

/**
 * A variable is a short string that is used to reference a value that is resolved and replaced in the user prompt at request-time.
 */
export interface AIVariable {
  /** provider id */
  id: string;
  /** variable name, used for referencing variables in the chat */
  name: string;
  /** variable description */
  description: string;
  /** optional label, used for showing the variable in the UI. If not provided, the variable name is used */
  label?: string;
  /** optional icon classes, used for showing the variable in the UI. */
  iconClasses?: string[];
  /** specifies whether this variable contributes to the context -- @see ResolvedAIContextVariable */
  isContextVariable?: boolean;
  /** optional arguments for resolving the variable into a value */
  args?: AIVariableDescription[];
}

export namespace AIVariable {
  export function is(arg: unknown): arg is AIVariable {
    return !!arg && typeof arg === 'object'
      && 'id' in arg
      && 'name' in arg
      && 'description' in arg;
  }
}

export interface AIContextVariable extends AIVariable {
  label: string;
  isContextVariable: true;
}

export namespace AIContextVariable {
  export function is(arg: unknown): arg is AIContextVariable {
    return AIVariable.is(arg) && 'isContextVariable' in arg && arg.isContextVariable === true;
  }
}

export interface AIVariableDescription {
  name: string;
  description: string;
  enum?: string[];
  isOptional?: boolean;
}

export interface ResolvedAIVariable {
  variable: AIVariable;
  arg?: string;
  /** value that is inserted into the prompt at the position of the variable usage */
  value: string;
  /** Flat list of all variables that have been (recursively) resolved while resolving this variable. */
  allResolvedDependencies?: ResolvedAIVariable[];
}

export namespace ResolvedAIVariable {
  export function is(arg: unknown): arg is ResolvedAIVariable {
    return !!arg && typeof arg === 'object'
      && 'variable' in arg
      && 'value' in arg
      && typeof (arg as { variable: unknown }).variable === 'object'
      && typeof (arg as { value: unknown }).value === 'string';
  }
}

/**
 * A context variable is a variable that also contributes to the context of a chat request.
 *
 * In contrast to a plain variable, it can also be attached to a request and is resolved into a context value.
 * The context value is put into the `ChatRequestModel.context`, available to the processing chat agent for further
 * processing by the chat agent, or invoked tool functions.
 */
export interface ResolvedAIContextVariable extends ResolvedAIVariable {
  contextValue: string;
}

export namespace ResolvedAIContextVariable {
  export function is(arg: unknown): arg is ResolvedAIContextVariable {
    return ResolvedAIVariable.is(arg)
      && 'contextValue' in arg
      && typeof (arg as { contextValue: unknown }).contextValue === 'string';
  }
}

export interface AIVariableResolutionRequest {
  variable: AIVariable;
  arg?: string;
}

export namespace AIVariableResolutionRequest {
  export function is(arg: unknown): arg is AIVariableResolutionRequest {
    return !!arg && typeof arg === 'object'
      && 'variable' in arg
      && typeof (arg as { variable: { name: unknown } }).variable.name === 'string';
  }

  export function fromResolved(arg: ResolvedAIContextVariable): AIVariableResolutionRequest {
    return {
      variable: arg.variable,
      arg: arg.arg,
    };
  }
}

export interface AIVariableContext {
}

export type AIVariableArg = string | { variable: string; arg?: string } | AIVariableResolutionRequest;

export type AIVariableArgPicker = (context: AIVariableContext) => MaybePromise<string | undefined>;
export type AIVariableArgCompletionProvider =
    (model: monaco.editor.ITextModel, position: monaco.Position, matchString?: string) => MaybePromise<monaco.languages.CompletionItem[] | undefined>;

export interface AIVariableResolver {
  canResolve: (request: AIVariableResolutionRequest, context: AIVariableContext) => MaybePromise<number>;
  resolve: (request: AIVariableResolutionRequest, context: AIVariableContext) => Promise<ResolvedAIVariable | undefined>;
}

export interface AIVariableOpener {
  canOpen: (request: AIVariableResolutionRequest, context: AIVariableContext) => MaybePromise<number>;
  open: (request: AIVariableResolutionRequest, context: AIVariableContext) => Promise<void>;
}

export interface AIVariableResolverWithVariableDependencies extends AIVariableResolver {
  resolve: ((request: AIVariableResolutionRequest, context: AIVariableContext) => Promise<ResolvedAIVariable | undefined>) & ((
    request: AIVariableResolutionRequest,
    context: AIVariableContext,
    resolveDependency: (variable: AIVariableArg) => Promise<ResolvedAIVariable | undefined>
  ) => Promise<ResolvedAIVariable | undefined>);
}

function isResolverWithDependencies(resolver: AIVariableResolver | undefined): resolver is AIVariableResolverWithVariableDependencies {
  return resolver !== undefined && resolver.resolve.length >= 3;
}

export const AIVariableService = Symbol('AIVariableService');
export interface AIVariableService {
  hasVariable: (name: string) => boolean;
  getVariable: (name: string) => Readonly<AIVariable> | undefined;
  getVariables: () => Readonly<AIVariable>[];
  getContextVariables: () => Readonly<AIContextVariable>[];
  unregisterVariable: (name: string) => void;
  readonly onDidChangeVariables: Event<void>;

  registerResolver: (variable: AIVariable, resolver: AIVariableResolver) => IDisposable;
  unregisterResolver: (variable: AIVariable, resolver: AIVariableResolver) => void;
  getResolver: (name: string, arg: string | undefined, context: AIVariableContext) => Promise<AIVariableResolver | undefined>;
  resolveVariable: (variable: AIVariableArg, context: AIVariableContext, cache?: Map<string, ResolveAIVariableCacheEntry>) => Promise<ResolvedAIVariable | undefined>;

  registerArgumentPicker: (variable: AIVariable, argPicker: AIVariableArgPicker) => IDisposable;
  unregisterArgumentPicker: (variable: AIVariable, argPicker: AIVariableArgPicker) => void;
  getArgumentPicker: (name: string, context: AIVariableContext) => Promise<AIVariableArgPicker | undefined>;

  registerArgumentCompletionProvider: (variable: AIVariable, argPicker: AIVariableArgCompletionProvider) => IDisposable;
  unregisterArgumentCompletionProvider: (variable: AIVariable, argPicker: AIVariableArgCompletionProvider) => void;
  getArgumentCompletionProvider: (name: string) => Promise<AIVariableArgCompletionProvider | undefined>;
}

/** Contributions on the frontend can optionally implement `FrontendVariableContribution`. */
export const AIVariableContribution = Symbol('AIVariableContribution');
export interface AIVariableContribution {
  registerVariables: (service: AIVariableService) => void;
}

export interface ResolveAIVariableCacheEntry {
  promise: Promise<ResolvedAIVariable | undefined>;
  inProgress: boolean;
}

export type ResolveAIVariableCache = Map<string, ResolveAIVariableCacheEntry>;
/**
 * Creates a new, empty cache for AI variable resolution to hand into `AIVariableService.resolveVariable`.
 */
export function createAIResolveVariableCache(): Map<string, ResolveAIVariableCacheEntry> {
  return new Map();
}

/** Utility function to get all resolved AI variables from a {@link ResolveAIVariableCache}  */
export async function getAllResolvedAIVariables(cache: ResolveAIVariableCache): Promise<ResolvedAIVariable[]> {
  const resolvedVariables: ResolvedAIVariable[] = [];
  for (const cacheEntry of cache.values()) {
    if (!cacheEntry.inProgress) {
      const resolvedVariable = await cacheEntry.promise;
      if (resolvedVariable) {
        resolvedVariables.push(resolvedVariable);
      }
    }
  }
  return resolvedVariables;
}

export class DefaultAIVariableService extends InjectableService implements AIVariableService {
  protected variables = new Map<string, AIVariable>();
  protected resolvers = new Map<string, AIVariableResolver[]>();
  protected argPickers = new Map<string, AIVariableArgPicker>();
  protected openers = new Map<string, AIVariableOpener[]>();
  protected argCompletionProviders = new Map<string, AIVariableArgCompletionProvider>();

  protected readonly onDidChangeVariablesEmitter = new Emitter<void>();
  readonly onDidChangeVariables: Event<void> = this.onDidChangeVariablesEmitter.event;

  constructor(
    @IAIVariableContributionProvider protected readonly contributionProvider: IAIVariableContributionProvider,
  ) {
    super();
  }

  protected initContributions(): void {
    this.contributionProvider.getContributions().forEach(contribution => contribution.registerVariables(this));
  }

  protected getKey(name: string): string {
    return `${name.toLowerCase()}`;
  }

  async getResolver(name: string, arg: string | undefined, context: AIVariableContext): Promise<AIVariableResolver | undefined> {
    const resolvers = await this.prioritize(name, arg, context);
    return resolvers[0];
  }

  protected getResolvers(name: string): AIVariableResolver[] {
    return this.resolvers.get(this.getKey(name)) ?? [];
  }

  protected async prioritize(name: string, arg: string | undefined, context: AIVariableContext): Promise<AIVariableResolver[]> {
    const variable = this.getVariable(name);
    if (!variable) {
      return [];
    }
    const prioritized = await Prioritizeable.prioritizeAll(this.getResolvers(name), async (resolver) => {
      try {
        return await resolver.canResolve({ variable, arg }, context);
      }
      catch {
        return 0;
      }
    });
    return prioritized.map(p => p.value);
  }

  hasVariable(name: string): boolean {
    return !!this.getVariable(name);
  }

  getVariable(name: string): Readonly<AIVariable> | undefined {
    return this.variables.get(this.getKey(name));
  }

  getVariables(): Readonly<AIVariable>[] {
    return [...this.variables.values()];
  }

  getContextVariables(): Readonly<AIContextVariable>[] {
    return this.getVariables().filter(AIContextVariable.is);
  }

  registerResolver(variable: AIVariable, resolver: AIVariableResolver): IDisposable {
    const key = this.getKey(variable.name);
    if (!this.variables.get(key)) {
      this.variables.set(key, variable);
      this.onDidChangeVariablesEmitter.fire();
    }
    const resolvers = this.resolvers.get(key) ?? [];
    resolvers.push(resolver);
    this.resolvers.set(key, resolvers);
    return toDisposable(() => this.unregisterResolver(variable, resolver));
  }

  unregisterResolver(variable: AIVariable, resolver: AIVariableResolver): void {
    const key = this.getKey(variable.name);
    const registeredResolvers = this.resolvers.get(key);
    registeredResolvers?.splice(registeredResolvers.indexOf(resolver), 1);
    if (registeredResolvers?.length === 0) {
      this.unregisterVariable(variable.name);
    }
  }

  unregisterVariable(name: string): void {
    this.variables.delete(this.getKey(name));
    this.resolvers.delete(this.getKey(name));
    this.onDidChangeVariablesEmitter.fire();
  }

  registerArgumentPicker(variable: AIVariable, argPicker: AIVariableArgPicker): IDisposable {
    const key = this.getKey(variable.name);
    this.argPickers.set(key, argPicker);
    return toDisposable(() => this.unregisterArgumentPicker(variable, argPicker));
  }

  unregisterArgumentPicker(variable: AIVariable, argPicker: AIVariableArgPicker): void {
    const key = this.getKey(variable.name);
    const registeredArgPicker = this.argPickers.get(key);
    if (registeredArgPicker === argPicker) {
      this.argPickers.delete(key);
    }
  }

  async getArgumentPicker(name: string): Promise<AIVariableArgPicker | undefined> {
    return this.argPickers.get(this.getKey(name)) ?? undefined;
  }

  registerArgumentCompletionProvider(variable: AIVariable, completionProvider: AIVariableArgCompletionProvider): IDisposable {
    const key = this.getKey(variable.name);
    this.argCompletionProviders.set(key, completionProvider);
    return toDisposable(() => this.unregisterArgumentCompletionProvider(variable, completionProvider));
  }

  unregisterArgumentCompletionProvider(variable: AIVariable, completionProvider: AIVariableArgCompletionProvider): void {
    const key = this.getKey(variable.name);
    const registeredCompletionProvider = this.argCompletionProviders.get(key);
    if (registeredCompletionProvider === completionProvider) {
      this.argCompletionProviders.delete(key);
    }
  }

  async getArgumentCompletionProvider(name: string): Promise<AIVariableArgCompletionProvider | undefined> {
    return this.argCompletionProviders.get(this.getKey(name)) ?? undefined;
  }

  protected parseRequest(request: AIVariableArg): { variableName: string; arg: string | undefined } {
    const variableName = typeof request === 'string'
      ? request
      : typeof request.variable === 'string'
        ? request.variable
        : request.variable.name;
    const arg = typeof request === 'string' ? undefined : request.arg;
    return { variableName, arg };
  }

  async resolveVariable(
    request: AIVariableArg,
    context: AIVariableContext,
        cache: ResolveAIVariableCache = createAIResolveVariableCache(),
  ): Promise<ResolvedAIVariable | undefined> {
    // Calculate unique variable cache key from variable name and argument
    const { variableName, arg } = this.parseRequest(request);
    const cacheKey = `${variableName}${PromptText.VARIABLE_SEPARATOR_CHAR}${arg ?? ''}`;

    // If the current cache key exists and is still in progress, we reached a cycle.
    // If we reach it but it has been resolved, it was part of another resolution branch and we can simply return it.
    if (cache.has(cacheKey)) {
      const existingEntry = cache.get(cacheKey)!;
      if (existingEntry.inProgress) {
        console.warn(`Cycle detected for variable: ${variableName} with arg: ${arg}. Skipping resolution.`);
        return undefined;
      }
      return existingEntry.promise;
    }

    const entry: ResolveAIVariableCacheEntry = { promise: this.doResolve(variableName, arg, context, cache), inProgress: true };
    entry.promise.finally(() => entry.inProgress = false);
    cache.set(cacheKey, entry);

    return entry.promise;
  }

  /**
     * Asynchronously resolves a variable, handling its dependencies while preventing cyclical resolution.
     * Selects the appropriate resolver and resolution strategy based on whether nested dependency resolution is supported.
     */
  protected async doResolve(variableName: string, arg: string | undefined, context: AIVariableContext, cache: ResolveAIVariableCache): Promise<ResolvedAIVariable | undefined> {
    const variable = this.getVariable(variableName);
    if (!variable) {
      return undefined;
    }
    const resolver = await this.getResolver(variableName, arg, context);
    let resolved: ResolvedAIVariable | undefined;
    if (isResolverWithDependencies(resolver)) {
      // Explicit cast needed because Typescript does not consider the method parameter length of the type guard at compile time
      resolved = await (resolver as AIVariableResolverWithVariableDependencies).resolve(
        { variable, arg },
        context,
        (async (depRequest: AIVariableResolutionRequest) => this.resolveVariable(depRequest, context, cache)) as any,
      );
    }
    else if (resolver) {
      // Explicit cast needed because Typescript does not consider the method parameter length of the type guard at compile time
      resolved = await (resolver as AIVariableResolver).resolve({ variable, arg }, context);
    }
    else {
      resolved = undefined;
    }
    return resolved ? { ...resolved, arg } : undefined;
  }
}
export const IAIVariableService = createServiceDecorator<IAIVariableService>(DefaultAIVariableService.name);
export type IAIVariableService = AIVariableService;
