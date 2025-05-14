import { InjectableService, MaybePromise } from '@gepick/core/common';
import { AIVariable, AIVariableContext, AIVariableContribution, AIVariableResolutionRequest, AIVariableResolver, AIVariableService, ResolvedAIVariable } from './variable-service';

export namespace TodayVariableArgs {
  export const IN_UNIX_SECONDS = 'inUnixSeconds';
  export const IN_ISO_8601 = 'inIso8601';
}

export const TODAY_VARIABLE: AIVariable = {
  id: 'today-provider',
  description: 'Does something for today',
  name: 'today',
  args: [
    {
      name: 'Format',
      description: 'The format of the date',
      enum: [TodayVariableArgs.IN_ISO_8601, TodayVariableArgs.IN_UNIX_SECONDS],
      isOptional: true,
    },
  ],
};

export interface ResolvedTodayVariable extends ResolvedAIVariable {
  date: Date;
}

export class TodayVariableContribution extends InjectableService implements AIVariableContribution, AIVariableResolver {
  registerVariables(service: AIVariableService): void {
    service.registerResolver(TODAY_VARIABLE, this);
  }

  canResolve(request: AIVariableResolutionRequest, context: AIVariableContext): MaybePromise<number> {
    return 1;
  }

  async resolve(request: AIVariableResolutionRequest, context: AIVariableContext): Promise<ResolvedAIVariable | undefined> {
    if (request.variable.name === TODAY_VARIABLE.name) {
      return this.resolveTodayVariable(request);
    }
    return undefined;
  }

  private resolveTodayVariable(request: AIVariableResolutionRequest): ResolvedTodayVariable {
    const date = new Date();
    if (request.arg === TodayVariableArgs.IN_ISO_8601) {
      return { variable: request.variable, value: date.toISOString(), date };
    }
    if (request.arg === TodayVariableArgs.IN_UNIX_SECONDS) {
      return { variable: request.variable, value: Math.round(date.getTime() / 1000).toString(), date };
    }
    return { variable: request.variable, value: date.toDateString(), date };
  }
}
