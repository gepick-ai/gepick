import { Emitter, Event, InjectableService, Optional, PostConstruct, createServiceDecorator } from '@gepick/core/common';
import { Agent } from './agent';
import { IAISettingsService } from './settings-service';
import { IPromptService } from './prompt-service';

export const AgentService = Symbol('AgentService');

/**
 * Service to access the list of known Agents.
 */
export interface AgentService {
  /**
     * Retrieves a list of all available agents, i.e. agents which are not disabled
     */
  getAgents(): Agent[];
  /**
     * Retrieves a list of all agents, including disabled ones.
     */
  getAllAgents(): Agent[];
  /**
     * Enable the agent with the specified id.
     * @param agentId the agent id.
     */
  enableAgent(agentId: string): void;
  /**
     * disable the agent with the specified id.
     * @param agentId the agent id.
     */
  disableAgent(agentId: string): void;
  /**
     * query whether this agent is currently enabled or disabled.
     * @param agentId the agent id.
     * @return true if the agent is enabled, false otherwise.
     */
  isEnabled(agentId: string): boolean;

  /**
     * Allows to register an agent programmatically.
     * @param agent the agent to register
     */
  registerAgent(agent: Agent): void;

  /**
     * Allows to unregister an agent programmatically.
     * @param agentId the agent id to unregister
     */
  unregisterAgent(agentId: string): void;

  /**
     * Emitted when the list of agents changes.
     * This can be used to update the UI when agents are added or removed.
     */
  onDidChangeAgents: Event<void>;
}

export class AgentServiceImpl extends InjectableService implements AgentService {
  protected disabledAgents = new Set<string>();

  protected _agents: Agent[] = [];

  private readonly onDidChangeAgentsEmitter = new Emitter<void>();
  readonly onDidChangeAgents = this.onDidChangeAgentsEmitter.event;

  constructor(
    @Optional() @IAISettingsService protected readonly aiSettingsService: IAISettingsService | undefined,
    @IPromptService protected readonly promptService: IPromptService,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.aiSettingsService?.getSettings().then((settings) => {
      Object.entries(settings).forEach(([agentId, agentSettings]) => {
        if (agentSettings.enable === false) {
          this.disabledAgents.add(agentId);
        }
      });
    });
  }

  registerAgent(agent: Agent): void {
    this._agents.push(agent);
    agent.promptTemplates.forEach(
      template => this.promptService.storePromptTemplate(template),
    );
    this.onDidChangeAgentsEmitter.fire();
  }

  unregisterAgent(agentId: string): void {
    const agent = this._agents.find(a => a.id === agentId);
    this._agents = this._agents.filter(a => a.id !== agentId);
    this.onDidChangeAgentsEmitter.fire();
    agent?.promptTemplates.forEach(
      template => this.promptService.removePrompt(template.id),
    );
  }

  getAgents(): Agent[] {
    return this._agents.filter(agent => this.isEnabled(agent.id));
  }

  getAllAgents(): Agent[] {
    return this._agents;
  }

  enableAgent(agentId: string): void {
    this.disabledAgents.delete(agentId);
    this.aiSettingsService?.updateAgentSettings(agentId, { enable: true });
  }

  disableAgent(agentId: string): void {
    this.disabledAgents.add(agentId);
    this.aiSettingsService?.updateAgentSettings(agentId, { enable: false });
  }

  isEnabled(agentId: string): boolean {
    return !this.disabledAgents.has(agentId);
  }
}
export const IAgentService = createServiceDecorator<IAgentService>(AgentServiceImpl.name);
export type IAgentService = AgentServiceImpl;
