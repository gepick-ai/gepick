import { IPreferencesService, JSONObject } from "@gepick/core/browser";
import { DisposableCollection, Emitter, Event, PreferenceScope } from "@gepick/core/common";
import { AISettings, AISettingsService, AgentSettings } from "@gepick/ai-core/common";

export class AISettingsServiceImpl implements AISettingsService {
  @IPreferencesService protected preferenceService: IPreferencesService;
  static readonly PREFERENCE_NAME = 'ai-features.agentSettings';

  protected toDispose = new DisposableCollection();

  protected readonly onDidChangeEmitter = new Emitter<void>();
  onDidChange: Event<void> = this.onDidChangeEmitter.event;

  async updateAgentSettings(agent: string, agentSettings: Partial<AgentSettings>): Promise<void> {
    const settings = await this.getSettings();
    const newAgentSettings = { ...settings[agent], ...agentSettings };
    settings[agent] = newAgentSettings;
    this.preferenceService.set(AISettingsServiceImpl.PREFERENCE_NAME, settings, PreferenceScope.User);
    this.onDidChangeEmitter.fire();
  }

  async getAgentSettings(agent: string): Promise<AgentSettings | undefined> {
    const settings = await this.getSettings();
    return settings[agent];
  }

  async getSettings(): Promise<AISettings> {
    await this.preferenceService.ready;
    const pref = this.preferenceService.inspect<AISettings & JSONObject>(AISettingsServiceImpl.PREFERENCE_NAME);
    return pref?.value ? pref.value : {};
  }
}
