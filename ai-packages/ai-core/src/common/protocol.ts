import { Event, createServiceDecorator } from '@gepick/core/common';
import { LanguageModelMetaData } from './language-model';
import { TokenUsage } from './token-usage-service';

export const LanguageModelRegistryClient = Symbol('LanguageModelRegistryClient');
export interface LanguageModelRegistryClient {
  languageModelAdded(metadata: LanguageModelMetaData): void;
  languageModelRemoved(id: string): void;
}

export const TOKEN_USAGE_SERVICE_PATH = '/services/token-usage';

export const TokenUsageServiceClient = Symbol('TokenUsageServiceClient');

export interface TokenUsageServiceClient {
  /**
     * Notify the client about new token usage
     */
  notifyTokenUsage(usage: TokenUsage): void;

  /**
     * An event that is fired when token usage data is updated.
     */
  readonly onTokenUsageUpdated: Event<TokenUsage>;
}

export const ITokenUsageServiceClient = createServiceDecorator<ITokenUsageServiceClient>('TokenUsageServiceClient');
export type ITokenUsageServiceClient = TokenUsageServiceClient;
