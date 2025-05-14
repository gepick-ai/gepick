import { Emitter, Event, InjectableService, MaybePromise } from '@gepick/core/common';
import { ContextKey, IApplicationContribution, IContextKeyService, IPreferencesService } from '@gepick/core/browser';
import { PREFERENCE_NAME_ENABLE_AI } from './ai-core-preferences';

/**
 * Context key for the AI features. It is set to `true` if the feature is enabled.
 */
// We reuse the enablement preference for the context key
export const ENABLE_AI_CONTEXT_KEY = PREFERENCE_NAME_ENABLE_AI;

export class AIActivationService extends InjectableService implements IApplicationContribution {
  protected isAiEnabledKey: ContextKey<boolean>;

  protected onDidChangeAIEnabled = new Emitter<boolean>();
  get onDidChangeActiveStatus(): Event<boolean> {
    return this.onDidChangeAIEnabled.event;
  }

  get isActive(): boolean {
    return this.isAiEnabledKey.get() ?? false;
  }

  constructor(
    @IContextKeyService protected readonly contextKeyService: IContextKeyService,
    @IPreferencesService protected preferenceService: IPreferencesService,
  ) {
    super();
  }

  protected updateEnableValue(value: boolean): void {
    if (value !== this.isAiEnabledKey.get()) {
      this.isAiEnabledKey.set(value);
      this.onDidChangeAIEnabled.fire(value);
    }
  }

  onApplicationInit(): MaybePromise<void> {
    this.isAiEnabledKey = this.contextKeyService.createKey(ENABLE_AI_CONTEXT_KEY, false) as ContextKey<boolean>;
    // make sure we don't miss once preferences are ready
    this.preferenceService.ready.then(() => {
      const enableValue = this.preferenceService.get<boolean>(PREFERENCE_NAME_ENABLE_AI, false);
      this.updateEnableValue(enableValue);
    });
    this.preferenceService.onPreferenceChanged((e) => {
      if (e.preferenceName === PREFERENCE_NAME_ENABLE_AI) {
        this.updateEnableValue(e.newValue);
      }
    });
  }
}
