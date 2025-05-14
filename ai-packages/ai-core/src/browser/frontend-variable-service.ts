import { IDisposable, Prioritizeable, createServiceDecorator, toDisposable } from '@gepick/core/common';
import { ApplicationContribution, IOpenerService, open } from '@gepick/core/browser';
import {
  AIVariable,
  AIVariableArg,
  AIVariableContext,
  AIVariableOpener,
  AIVariableResolutionRequest,
  AIVariableService,
  DefaultAIVariableService,
  IAIVariableResourceResolver,
  PromptText,
} from '@gepick/ai-core/common';
import * as monaco from '@theia/monaco-editor-core';

// TODO(@jaylenchen): 补充相关模块后替换这里为相关缺失模块的具体定义
type IMessageService = any;
const IMessageService = createServiceDecorator<IMessageService>("MessageService");

export type AIVariableDropHandler = (event: DragEvent, context: AIVariableContext) => Promise<AIVariableDropResult | undefined>;

export interface AIVariableDropResult {
  variables: AIVariableResolutionRequest[];
  text?: string;
};

export interface AIVariableCompletionContext {
  /** Portion of user input to be used for filtering completion candidates. */
  userInput: string;
  /** The range of suggestion completions. */
  range: monaco.Range;
  /** A prefix to be applied to each completion item's text */
  prefix: string;
}

export namespace AIVariableCompletionContext {
  export function get(
    variableName: string,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    matchString?: string,
  ): AIVariableCompletionContext | undefined {
    const lineContent = model.getLineContent(position.lineNumber);
    const indexOfVariableTrigger = lineContent.lastIndexOf(matchString ?? PromptText.VARIABLE_CHAR, position.column - 1);

    // check if there is a variable trigger and no space typed between the variable trigger and the cursor
    if (indexOfVariableTrigger === -1 || lineContent.substring(indexOfVariableTrigger).includes(' ')) {
      return undefined;
    }

    // determine whether we are providing completions before or after the variable argument separator
    const indexOfVariableArgSeparator = lineContent.lastIndexOf(PromptText.VARIABLE_SEPARATOR_CHAR, position.column - 1);
    const triggerCharIndex = Math.max(indexOfVariableTrigger, indexOfVariableArgSeparator);

    const userInput = lineContent.substring(triggerCharIndex + 1, position.column - 1);
    const range = new monaco.Range(position.lineNumber, triggerCharIndex + 2, position.lineNumber, position.column);
    const matchVariableChar = lineContent[triggerCharIndex] === (matchString || PromptText.VARIABLE_CHAR);
    const prefix = matchVariableChar ? variableName + PromptText.VARIABLE_SEPARATOR_CHAR : '';
    return { range, userInput, prefix };
  }
}

export const FrontendVariableService = Symbol('FrontendVariableService');
export interface FrontendVariableService extends AIVariableService {
  registerDropHandler(handler: AIVariableDropHandler): IDisposable;
  unregisterDropHandler(handler: AIVariableDropHandler): void;
  getDropResult(event: DragEvent, context: AIVariableContext): Promise<AIVariableDropResult>;

  registerOpener(variable: AIVariable, opener: AIVariableOpener): IDisposable;
  unregisterOpener(variable: AIVariable, opener: AIVariableOpener): void;
  getOpener(name: string, arg: string | undefined, context: AIVariableContext): Promise<AIVariableOpener | undefined>;
  open(variable: AIVariableArg, context?: AIVariableContext): Promise<void>;
}

export interface FrontendVariableContribution {
  registerVariables(service: FrontendVariableService): void;
}

export class DefaultFrontendVariableService extends DefaultAIVariableService implements ApplicationContribution, FrontendVariableService {
  protected dropHandlers = new Set<AIVariableDropHandler>();

  @IMessageService protected readonly messageService: IMessageService;
  @IAIVariableResourceResolver protected readonly aiResourceResolver: IAIVariableResourceResolver;
  @IOpenerService protected readonly openerService: IOpenerService;

  onStart(): void {
    this.initContributions();
  }

  registerDropHandler(handler: AIVariableDropHandler): IDisposable {
    this.dropHandlers.add(handler);
    return toDisposable(() => this.unregisterDropHandler(handler));
  }

  unregisterDropHandler(handler: AIVariableDropHandler): void {
    this.dropHandlers.delete(handler);
  }

  async getDropResult(event: DragEvent, context: AIVariableContext): Promise<AIVariableDropResult> {
    let text: string | undefined;
    const variables: AIVariableResolutionRequest[] = [];
    for (const handler of this.dropHandlers) {
      const result = await handler(event, context);
      if (result) {
        variables.push(...result.variables);
        if (text === undefined) {
          text = result.text;
        }
      }
    }
    return { variables, text };
  }

  registerOpener(variable: AIVariable, opener: AIVariableOpener): IDisposable {
    const key = this.getKey(variable.name);
    if (!this.variables.get(key)) {
      this.variables.set(key, variable);
      this.onDidChangeVariablesEmitter.fire();
    }
    const openers = this.openers.get(key) ?? [];
    openers.push(opener);
    this.openers.set(key, openers);
    return toDisposable(() => this.unregisterOpener(variable, opener));
  }

  unregisterOpener(variable: AIVariable, opener: AIVariableOpener): void {
    const key = this.getKey(variable.name);
    const registeredOpeners = this.openers.get(key);
    registeredOpeners?.splice(registeredOpeners.indexOf(opener), 1);
  }

  async getOpener(name: string, arg: string | undefined, context: AIVariableContext = {}): Promise<AIVariableOpener | undefined> {
    const variable = this.getVariable(name);
    return variable && Prioritizeable.prioritizeAll(
      this.openers.get(this.getKey(name)) ?? [],
      opener => (async () => opener.canOpen({ variable, arg }, context))().catch(() => 0),
    )
      .then(prioritized => prioritized.at(0)?.value);
  }

  async open(request: AIVariableArg, context?: AIVariableContext | undefined): Promise<void> {
    const { variableName, arg } = this.parseRequest(request);
    const variable = this.getVariable(variableName);
    if (!variable) {
      this.messageService.warn('No variable found for open request.');
      return;
    }
    const opener = await this.getOpener(variableName, arg, context);
    try {
      return opener ? opener.open({ variable, arg }, context ?? {}) : this.openReadonly({ variable, arg }, context);
    }
    catch (err) {
      console.error('Unable to open variable:', err);
      this.messageService.error('Unable to display variable value.');
    }
  }

  protected async openReadonly(request: AIVariableResolutionRequest, context: AIVariableContext = {}): Promise<void> {
    const resolved = await this.resolveVariable(request, context);
    if (resolved === undefined) {
      this.messageService.warn('Unable to resolve variable.');
      return;
    }
    const resource = this.aiResourceResolver.getOrCreate(request, context, resolved.value);
    await open(this.openerService, resource.uri);
    resource.dispose();
  }
}
