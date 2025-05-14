import { CancellationToken, Event, IContributionProvider, createContribution, createServiceDecorator, isFunction, isObject } from "@gepick/core/common";

export type MessageActor = 'user' | 'ai' | 'system';

export type LanguageModelMessage = TextMessage | ThinkingMessage | ToolUseMessage | ToolResultMessage;
export namespace LanguageModelMessage {

  export function isTextMessage(obj: LanguageModelMessage): obj is TextMessage {
    return obj.type === 'text';
  }
  export function isThinkingMessage(obj: LanguageModelMessage): obj is ThinkingMessage {
    return obj.type === 'thinking';
  }
  export function isToolUseMessage(obj: LanguageModelMessage): obj is ToolUseMessage {
    return obj.type === 'tool_use';
  }
  export function isToolResultMessage(obj: LanguageModelMessage): obj is ToolResultMessage {
    return obj.type === 'tool_result';
  }
}
export interface TextMessage {
  actor: MessageActor;
  type: 'text';
  text: string;
}
export interface ThinkingMessage {
  actor: 'ai';
  type: 'thinking';
  thinking: string;
  signature: string;
}

export interface ToolResultMessage {
  actor: 'user';
  tool_use_id: string;
  name: string;
  type: 'tool_result';
  content?: string;
  is_error?: boolean;
}

export interface ToolUseMessage {
  actor: 'ai';
  type: 'tool_use';
  id: string;
  input: unknown;
  name: string;
}

export const isLanguageModelRequestMessage = (obj: unknown): obj is LanguageModelMessage =>
  !!(obj && typeof obj === 'object'
    && 'type' in obj
    && typeof (obj as { type: unknown }).type === 'string'
    && (obj as { type: unknown }).type === 'text'
    && 'query' in obj
    && typeof (obj as { query: unknown }).query === 'string'
  );

export interface ToolRequestParameterProperty {
  type?: string;
  anyOf?: ToolRequestParameterProperty[];
  [key: string]: unknown;
}

export type ToolRequestParametersProperties = Record<string, ToolRequestParameterProperty>;
export interface ToolRequestParameters {
  type?: 'object';
  properties: ToolRequestParametersProperties;
  required?: string[];
}
export interface ToolRequest {
  id: string;
  name: string;
  parameters: ToolRequestParameters;
  description?: string;
  handler: (arg_string: string, ctx?: unknown) => Promise<unknown>;
  providerName?: string;
}

export namespace ToolRequest {
  function isToolRequestParameterProperty(obj: unknown): obj is ToolRequestParameterProperty {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    const record = obj as Record<string, unknown>;

    // Check that at least one of "type" or "anyOf" exists
    if (!('type' in record) && !('anyOf' in record)) {
      return false;
    }

    // If an "anyOf" field is present, it must be an array where each item is also a valid property.
    if ('anyOf' in record) {
      if (!Array.isArray(record.anyOf)) {
        return false;
      }
      for (const item of record.anyOf) {
        if (!isToolRequestParameterProperty(item)) {
          return false;
        }
      }
    }
    if ('type' in record && typeof record.type !== 'string') {
      return false;
    }

    // No further checks required for additional properties.
    return true;
  }
  export function isToolRequestParametersProperties(obj: unknown): obj is ToolRequestParametersProperties {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    return Object.entries(obj).every(([key, value]) => {
      if (typeof key !== 'string') {
        return false;
      }
      return isToolRequestParameterProperty(value);
    });
  }
  export function isToolRequestParameters(obj: unknown): obj is ToolRequestParameters {
    return !!obj && typeof obj === 'object'
      && (!('type' in obj) || obj.type === 'object')
      && 'properties' in obj && isToolRequestParametersProperties(obj.properties)
      && (!('required' in obj) || (Array.isArray(obj.required) && obj.required.every(prop => typeof prop === 'string')));
  }
}
export interface LanguageModelRequest {
  messages: LanguageModelMessage[];
  tools?: ToolRequest[];
  response_format?: { type: 'text' } | { type: 'json_object' } | ResponseFormatJsonSchema;
  settings?: { [key: string]: unknown };
  clientSettings?: { keepToolCalls: boolean; keepThinking: boolean };
}
export interface ResponseFormatJsonSchema {
  type: 'json_schema';
  json_schema: {
    name: string;
    description?: string;
    schema?: Record<string, unknown>;
    strict?: boolean | null;
  };
}

export interface UserRequest extends LanguageModelRequest {
  sessionId: string;
  requestId: string;
  agentId: string;
  cancellationToken?: CancellationToken;
}

export interface LanguageModelTextResponse {
  text: string;
}
export const isLanguageModelTextResponse = (obj: unknown): obj is LanguageModelTextResponse =>
  !!(obj && typeof obj === 'object' && 'text' in obj && typeof (obj as { text: unknown }).text === 'string');

export type LanguageModelStreamResponsePart = TextResponsePart | ToolCallResponsePart | ThinkingResponsePart | UsageResponsePart;
export interface UsageResponsePart {
  input_tokens: number;
  output_tokens: number;
}
export const isUsageResponsePart = (part: unknown): part is UsageResponsePart =>
  !!(part && typeof part === 'object'
    && 'input_tokens' in part && typeof part.input_tokens === 'number'
    && 'output_tokens' in part && typeof part.output_tokens === 'number');
export interface TextResponsePart {
  content: string;
}
export const isTextResponsePart = (part: unknown): part is TextResponsePart =>
  !!(part && typeof part === 'object' && 'content' in part && typeof part.content === 'string');

export interface ToolCallResponsePart {
  tool_calls: ToolCall[];
}
export const isToolCallResponsePart = (part: unknown): part is ToolCallResponsePart =>
  !!(part && typeof part === 'object' && 'tool_calls' in part && Array.isArray(part.tool_calls));

export interface ThinkingResponsePart {
  thought: string;
  signature: string;
}
export const isThinkingResponsePart = (part: unknown): part is ThinkingResponsePart =>
  !!(part && typeof part === 'object' && 'thought' in part && typeof part.thought === 'string');

export interface ToolCall {
  id?: string;
  function?: {
    arguments?: string;
    name?: string;
  };
  finished?: boolean;
  result?: string;
}

export interface LanguageModelStreamResponse {
  stream: AsyncIterable<LanguageModelStreamResponsePart>;
}
export const isLanguageModelStreamResponse = (obj: unknown): obj is LanguageModelStreamResponse =>
  !!(obj && typeof obj === 'object' && 'stream' in obj);

export interface LanguageModelParsedResponse {
  parsed: unknown;
  content: string;
}
export const isLanguageModelParsedResponse = (obj: unknown): obj is LanguageModelParsedResponse =>
  !!(obj && typeof obj === 'object' && 'parsed' in obj && 'content' in obj);

export type LanguageModelResponse = LanguageModelTextResponse | LanguageModelStreamResponse | LanguageModelParsedResponse;

///////////////////////////////////////////
// Language Model Provider
///////////////////////////////////////////

export const LanguageModelProvider = Symbol('LanguageModelProvider');
export type LanguageModelProvider = () => Promise<LanguageModel[]>;

// See also VS Code `ILanguageModelChatMetadata`
export interface LanguageModelMetaData {
  readonly id: string;
  readonly name?: string;
  readonly vendor?: string;
  readonly version?: string;
  readonly family?: string;
  readonly maxInputTokens?: number;
  readonly maxOutputTokens?: number;
}

export namespace LanguageModelMetaData {
  export function is(arg: unknown): arg is LanguageModelMetaData {
    return isObject(arg) && 'id' in arg;
  }
}

export interface LanguageModel extends LanguageModelMetaData {
  request(request: UserRequest, cancellationToken?: CancellationToken): Promise<LanguageModelResponse>;
}

export namespace LanguageModel {
  export function is(arg: unknown): arg is LanguageModel {
    return isObject(arg) && 'id' in arg && isFunction(arg.request);
  }
}

// See also VS Code `ILanguageModelChatSelector`
interface VsCodeLanguageModelSelector {
  readonly identifier?: string;
  readonly name?: string;
  readonly vendor?: string;
  readonly version?: string;
  readonly family?: string;
  readonly tokens?: number;
}

export interface LanguageModelSelector extends VsCodeLanguageModelSelector {
  readonly agent: string;
  readonly purpose: string;
}

export type LanguageModelRequirement = Omit<LanguageModelSelector, 'agent'>;

export const LanguageModelRegistry = Symbol('LanguageModelRegistry');
export interface LanguageModelRegistry {
  onChange: Event<{ models: LanguageModel[] }>;
  addLanguageModels(models: LanguageModel[]): void;
  getLanguageModels(): Promise<LanguageModel[]>;
  getLanguageModel(id: string): Promise<LanguageModel | undefined>;
  removeLanguageModels(id: string[]): void;
  selectLanguageModel(request: LanguageModelSelector): Promise<LanguageModel | undefined>;
  selectLanguageModels(request: LanguageModelSelector): Promise<LanguageModel[]>;
}
export const ILanguageModelRegistry = createServiceDecorator<ILanguageModelRegistry>("LanguageModelRegistry");
export type ILanguageModelRegistry = LanguageModelRegistry;

export function isModelMatching(request: LanguageModelSelector, model: LanguageModel): boolean {
  return (!request.identifier || model.id === request.identifier)
    && (!request.name || model.name === request.name)
    && (!request.vendor || model.vendor === request.vendor)
    && (!request.version || model.version === request.version)
    && (!request.family || model.family === request.family);
}

export const [ILanguageModelProvider, ILanguageModelProviderProvider] = createContribution<ILanguageModelProvider>("LanguageModelProvider");
export interface ILanguageModelProvider extends LanguageModelProvider {}
export interface ILanguageModelProviderProvider extends IContributionProvider<ILanguageModelProvider> {}
