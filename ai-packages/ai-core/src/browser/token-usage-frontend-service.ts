import { Event } from '@gepick/core/common';

/**
 * Data structure for token usage data specific to a model.
 */
export interface ModelTokenUsageData {
  /** The model identifier */
  modelId: string;
  /** Number of input tokens used */
  inputTokens: number;
  /** Number of output tokens used */
  outputTokens: number;
  /** Date when the model was last used */
  lastUsed?: Date;
}

/**
 * Service for managing token usage data on the frontend.
 */
export const TokenUsageFrontendService = Symbol('TokenUsageFrontendService');
export interface TokenUsageFrontendService {
  /**
     * Event emitted when token usage data is updated
     */
  readonly onTokenUsageUpdated: Event<ModelTokenUsageData[]>;

  /**
     * Gets the current token usage data for all models
     */
  getTokenUsageData(): Promise<ModelTokenUsageData[]>;
}
