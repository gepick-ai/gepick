import { createServiceDecorator } from '@gepick/core/common';
import { TokenUsageServiceClient } from './protocol';

export const TokenUsageService = Symbol('TokenUsageService');

export interface TokenUsage {
  /** The input token count */
  inputTokens: number;
  /** The output token count */
  outputTokens: number;
  /** The model identifier */
  model: string;
  /** The timestamp of when the tokens were used */
  timestamp: Date;
  /** Request identifier */
  requestId: string;
}

export interface TokenUsageParams {
  /** The input token count */
  inputTokens: number;
  /** The output token count */
  outputTokens: number;
  /** Request identifier */
  requestId: string;
}

export interface TokenUsageService {
  /**
     * Records token usage for a model interaction.
     *
     * @param model The identifier of the model that was used
     * @param params Object containing token usage information
     * @returns A promise that resolves when the token usage has been recorded
     */
  recordTokenUsage(model: string, params: TokenUsageParams): Promise<void>;

  getTokenUsages(): Promise<TokenUsage[]>;

  setClient(tokenUsageClient: TokenUsageServiceClient): void;
}

export const ITokenUsageService = createServiceDecorator('TokenUsageService');
export type ITokenUsageService = TokenUsageService;
