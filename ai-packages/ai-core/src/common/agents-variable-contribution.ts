import { InjectableService, MaybePromise } from '@gepick/core/common';
import { AIVariable, AIVariableContext, AIVariableContribution, AIVariableResolutionRequest, AIVariableResolver, AIVariableService, ResolvedAIVariable } from './variable-service';
import { IAgentService } from './agent-service';

export const AGENTS_VARIABLE: AIVariable = {
  id: 'agents',
  name: 'agents',
  description: 'Returns the list of agents available in the system',
};

export interface ResolvedAgentsVariable extends ResolvedAIVariable {
  agents: AgentDescriptor[];
}

export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
}

export class AgentsVariableContribution extends InjectableService implements AIVariableContribution, AIVariableResolver {
  constructor(
    @IAgentService protected readonly agentService: IAgentService,
  ) {
    super();
  }

  registerVariables(service: AIVariableService): void {
    service.registerResolver(AGENTS_VARIABLE, this);
  }

  canResolve(request: AIVariableResolutionRequest, _context: AIVariableContext): MaybePromise<number> {
    if (request.variable.name === AGENTS_VARIABLE.name) {
      return 1;
    }
    return -1;
  }

  async resolve(request: AIVariableResolutionRequest, _context: AIVariableContext): Promise<ResolvedAgentsVariable | undefined> {
    if (request.variable.name === AGENTS_VARIABLE.name) {
      const agents = this.agentService.getAgents().map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
      }));
      return { variable: AGENTS_VARIABLE, agents, value: JSON.stringify(agents) };
    }
    return undefined;
  }
}
