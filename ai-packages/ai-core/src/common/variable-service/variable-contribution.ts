import { Contribution, IContributionProvider, InjectableService, createContribution } from "@gepick/core/common";

export const [IAIVariableContribution, IAIVariableContributionProvider] = createContribution<IAIVariableContribution>("AIVariableContribution");

export interface IAIVariableContribution {
  registerVariables: (service: any) => void;
}
export interface IAIVariableContributionProvider extends IContributionProvider<IAIVariableContribution> {}

@Contribution(IAIVariableContribution)
export abstract class AbstractAIVariableContribution extends InjectableService {
  abstract registerVariables: (service: any) => void;
}
