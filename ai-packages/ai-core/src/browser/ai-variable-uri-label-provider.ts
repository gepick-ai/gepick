import { InjectableService, URI } from "@gepick/core/common";
import { AIVariableResolutionRequest, AI_VARIABLE_RESOURCE_SCHEME, IAIVariableResourceResolver, IAIVariableService } from "@gepick/ai-core/common";
import { ILabelProvider, ILabelProviderContribution } from "@gepick/core/browser";

export class AIVariableUriLabelProvider extends InjectableService implements ILabelProviderContribution {
  constructor(
    @ILabelProvider protected readonly labelProvider: ILabelProvider,
    @IAIVariableResourceResolver protected variableResourceResolver: IAIVariableResourceResolver,
    @IAIVariableService protected readonly variableService: IAIVariableService,
  ) {
    super();
  }

  protected isMine(element: object): element is URI {
    return element instanceof URI && element.scheme === AI_VARIABLE_RESOURCE_SCHEME;
  }

  canHandle(element: object): number {
    return this.isMine(element) ? 150 : -1;
  }

  getIcon(element: object): string | undefined {
    if (!this.isMine(element)) { return undefined; }
    return this.labelProvider.getIcon(this.getResolutionRequest(element)!);
  }

  getName(element: object): string | undefined {
    if (!this.isMine(element)) { return undefined; }
    return this.labelProvider.getName(this.getResolutionRequest(element)!);
  }

  getLongName(element: object): string | undefined {
    if (!this.isMine(element)) { return undefined; }
    return this.labelProvider.getLongName(this.getResolutionRequest(element)!);
  }

  getDetails(element: object): string | undefined {
    if (!this.isMine(element)) { return undefined; }
    return this.labelProvider.getDetails(this.getResolutionRequest(element)!);
  }

  protected getResolutionRequest(element: object): AIVariableResolutionRequest | undefined {
    if (!this.isMine(element)) { return undefined; }
    const metadata = this.variableResourceResolver.fromUri(element);
    if (!metadata) { return undefined; }
    const { variableName, arg } = metadata;
    const variable = this.variableService.getVariable(variableName);
    return variable && { variable, arg };
  }
}
