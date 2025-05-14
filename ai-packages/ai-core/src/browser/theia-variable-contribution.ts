import { AIVariableContext, AIVariableContribution, AIVariableResolutionRequest, AIVariableResolver, AIVariableService, ResolvedAIVariable } from '@gepick/ai-core/common';
import { InjectableService } from '@gepick/core/common';
import { IApplicationStateService } from "@gepick/core/browser";
import { IVariableRegistry, IVariableResolverService } from '@gepick/variable-resolver/browser';

/**
 * Mapping configuration for a Theia variable to one or more AI variables
 */
interface VariableMapping {
  name?: string;
  description?: string;
}

/**
 * Integrates the Theia VariableRegistry with the Theia AI VariableService
 */
export class TheiaVariableContribution extends InjectableService implements AIVariableContribution, AIVariableResolver {
  private static readonly THEIA_PREFIX = 'theia-';

  constructor(
    @IVariableResolverService protected readonly variableResolverService: IVariableResolverService,
    @IVariableRegistry protected readonly variableRegistry: IVariableRegistry,
    @IApplicationStateService protected readonly stateService: IApplicationStateService,
  ) {
    super();
  }

  // Map original variable name to one or more mappings with new name and description.
  // Only variables present in this map are registered.
  protected variableRenameMap: Map<string, VariableMapping[]> = new Map([
    ['file', [
      {
        name: 'currentAbsoluteFilePath',
        description: 'The absolute path of the \
                currently opened file. Please note that most agents will expect a relative file path (relative to the current workspace).',
      },
    ]],
    ['selectedText', [
      {
        description: 'The plain text that is currently selected in the \
                opened file. This excludes the information where the content is coming from. Please note that most agents will work better with a relative file path \
                (relative to the current workspace).',
      },
    ]],
    ['currentText', [
      {
        name: 'currentFileContent',
        description: 'The plain content of the \
                currently opened file. This excludes the information where the content is coming from. Please note that most agents will work better with a relative file path \
                (relative to the current workspace).',
      },
    ]],
    ['relativeFile', [
      {
        name: 'currentRelativeFilePath',
        description: 'The relative path of the \
                currently opened file.',
      },
      {
        name: '_f',
        description: 'Short reference to the relative path of the \
                currently opened file (\'currentRelativeFilePath\').',
      },
    ]],
    ['relativeFileDirname', [
      {
        name: 'currentRelativeDirPath',
        description: 'The relative path of the directory containing the currently opened file.',
      },
    ]],
    ['lineNumber', [{}]],
    ['workspaceFolder', [{}]],
  ]);

  registerVariables(service: AIVariableService): void {
    this.stateService.reachedState('initialized_layout').then(() => {
      // some variable contributions in Theia are done as part of the onStart, same as our AI variable contributions
      // we therefore wait for all of them to be registered before we register we map them to our own
      this.variableRegistry.getVariables().forEach((variable) => {
        if (!this.variableRenameMap.has(variable.name)) {
          return; // Do not register variables not part of the map
        }

        const mappings = this.variableRenameMap.get(variable.name)!;

        // Register each mapping for this variable
        mappings.forEach((mapping, index) => {
          const newName = (mapping.name && mapping.name.trim() !== '') ? mapping.name : variable.name;
          const newDescription = (mapping.description && mapping.description.trim() !== '')
            ? mapping.description
            : (variable.description && variable.description.trim() !== ''
                ? variable.description
                : 'Theia Built-in Variable');

          // For multiple mappings of the same variable, add a suffix to the ID to make it unique
          const idSuffix = mappings.length > 1 ? `-${index}` : '';
          const id = `${TheiaVariableContribution.THEIA_PREFIX}${variable.name}${idSuffix}`;

          service.registerResolver({
            id,
            name: newName,
            description: newDescription,
          }, this);
        });
      });
    });
  }

  protected toTheiaVariable(request: AIVariableResolutionRequest): string {
    // Extract the base variable name by removing the THEIA_PREFIX and any potential index suffix
    let variableId = request.variable.id;
    if (variableId.startsWith(TheiaVariableContribution.THEIA_PREFIX)) {
      variableId = variableId.slice(TheiaVariableContribution.THEIA_PREFIX.length);
      // Remove any potential index suffix (e.g., -0, -1)
      variableId = variableId.replace(/-\d+$/, '');
    }

    return `\${${variableId}${request.arg ? `:${request.arg}` : ''}}`;
  }

  async canResolve(request: AIVariableResolutionRequest, context: AIVariableContext): Promise<number> {
    if (!request.variable.id.startsWith(TheiaVariableContribution.THEIA_PREFIX)) {
      return 0;
    }
    // some variables are not resolvable without providing a specific context
    // this may be expensive but was not a problem for Theia's built-in variables
    const resolved = await this.variableResolverService.resolve(this.toTheiaVariable(request), context);
    return !resolved ? 0 : 1;
  }

  async resolve(request: AIVariableResolutionRequest, context: AIVariableContext): Promise<ResolvedAIVariable | undefined> {
    const resolved = await this.variableResolverService.resolve(this.toTheiaVariable(request), context);
    return resolved ? { value: resolved, variable: request.variable } : undefined;
  }
}
