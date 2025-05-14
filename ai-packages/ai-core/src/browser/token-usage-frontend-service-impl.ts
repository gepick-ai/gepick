import { Emitter, InjectableService, PostConstruct } from '@gepick/core/common';
import { ITokenUsageService, ITokenUsageServiceClient, TokenUsage, TokenUsageServiceClient } from '@gepick/ai-core/common';
import { ModelTokenUsageData, TokenUsageFrontendService } from './token-usage-frontend-service';

export class TokenUsageServiceClientImpl extends InjectableService implements TokenUsageServiceClient {
  private readonly _onTokenUsageUpdated = new Emitter<TokenUsage>();
  readonly onTokenUsageUpdated = this._onTokenUsageUpdated.event;

  notifyTokenUsage(usage: TokenUsage): void {
    this._onTokenUsageUpdated.fire(usage);
  }
}

export class TokenUsageFrontendServiceImpl extends InjectableService implements TokenUsageFrontendService {
  private readonly _onTokenUsageUpdated = new Emitter<ModelTokenUsageData[]>();
  readonly onTokenUsageUpdated = this._onTokenUsageUpdated.event;

  private cachedUsageData: ModelTokenUsageData[] = [];

  constructor(
    @ITokenUsageServiceClient protected readonly tokenUsageServiceClient: ITokenUsageServiceClient,
    @ITokenUsageService protected readonly tokenUsageService: ITokenUsageService,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.tokenUsageServiceClient.onTokenUsageUpdated(() => {
      this.getTokenUsageData().then((data) => {
        this._onTokenUsageUpdated.fire(data);
      });
    });
  }

  /**
     * Gets the current token usage data for all models
     */
  async getTokenUsageData(): Promise<ModelTokenUsageData[]> {
    try {
      const usages = await this.tokenUsageService.getTokenUsages();
      this.cachedUsageData = this.aggregateTokenUsages(usages);
      return this.cachedUsageData;
    }
    catch (error) {
      console.error('Failed to get token usage data:', error);
      return [];
    }
  }

  /**
     * Aggregates token usages by model
     */
  private aggregateTokenUsages(usages: TokenUsage[]): ModelTokenUsageData[] {
    // Group by model
    const modelMap = new Map<string, {
      inputTokens: number;
      outputTokens: number;
      lastUsed?: Date;
    }>();

    // Process each usage record
    for (const usage of usages) {
      const existing = modelMap.get(usage.model);

      if (existing) {
        existing.inputTokens += usage.inputTokens;
        existing.outputTokens += usage.outputTokens;

        // Update last used if this usage is more recent
        if (!existing.lastUsed || (usage.timestamp && usage.timestamp > existing.lastUsed)) {
          existing.lastUsed = usage.timestamp;
        }
      }
      else {
        modelMap.set(usage.model, {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          lastUsed: usage.timestamp,
        });
      }
    }

    // Convert map to array of model usage data
    const result: ModelTokenUsageData[] = [];

    for (const [modelId, data] of modelMap.entries()) {
      result.push({
        modelId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        lastUsed: data.lastUsed,
      });
    }

    return result;
  }
}
