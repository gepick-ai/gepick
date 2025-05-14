import { createRequire } from 'node:module';
import * as monaco from '@theia/monaco-editor-core';
import { TabBarToolbarContribution, TabBarToolbarRegistry, Widget, WidgetUtilities } from "@gepick/core/browser";
import { Command, CommandRegistry, InjectableService } from "@gepick/core/common";
import { IAIVariableService, IPromptCustomizationService, IPromptService, IToolInvocationRegistry, PromptText } from "@gepick/ai-core/common";
import { ProviderResult } from '@theia/monaco-editor-core/esm/vs/editor/common/languages';

// TODO(@jaylenchen): 补充相关模块后替换这里为相关缺失模块的具体定义
type TextmateRegistry = any;
type GrammarDefinition = any;
type GrammarDefinitionProvider = any;
const EditorWidget = {} as any;
type EditorWidget = any;
type ReplaceOperation = any;

const PROMPT_TEMPLATE_LANGUAGE_ID = 'theia-ai-prompt-template';
const PROMPT_TEMPLATE_TEXTMATE_SCOPE = 'source.prompttemplate';

export const PROMPT_TEMPLATE_EXTENSION = '.prompttemplate';

export const DISCARD_PROMPT_TEMPLATE_CUSTOMIZATIONS: Command = Command.toLocalizedCommand({
  id: 'theia-ai-prompt-template:discard',
  label: 'Discard AI Prompt Template',
  iconClass: WidgetUtilities.codicon('discard'),
  category: 'AI Prompt Templates',
}, 'theia/ai/core/discard/label', 'theia/ai/core/prompts/category');

export class PromptTemplateContribution extends InjectableService implements TabBarToolbarContribution {
  @IPromptService private readonly promptService: IPromptService;
  @IPromptCustomizationService protected readonly customizationService: IPromptCustomizationService;
  @IToolInvocationRegistry protected readonly toolInvocationRegistry: IToolInvocationRegistry;
  @IAIVariableService protected readonly variableService: IAIVariableService;

  readonly config: monaco.languages.LanguageConfiguration
    = {
      brackets: [
        ['${', '}'],
        ['~{', '}'],
        ['{{', '}}'],
        ['{{{', '}}}'],
      ],
      autoClosingPairs: [
        { open: '${', close: '}' },
        { open: '~{', close: '}' },
        { open: '{{', close: '}}' },
        { open: '{{{', close: '}}}' },
      ],
      surroundingPairs: [
        { open: '${', close: '}' },
        { open: '~{', close: '}' },
        { open: '{{', close: '}}' },
        { open: '{{{', close: '}}}' },
      ],
    };

  registerTextmateLanguage(registry: TextmateRegistry): void {
    monaco.languages.register({
      id: PROMPT_TEMPLATE_LANGUAGE_ID,
      aliases: [
        'AI Prompt Template',
      ],
      extensions: [
        PROMPT_TEMPLATE_EXTENSION,
      ],
      filenames: [],
    });

    monaco.languages.setLanguageConfiguration(PROMPT_TEMPLATE_LANGUAGE_ID, this.config);

    monaco.languages.registerCompletionItemProvider(PROMPT_TEMPLATE_LANGUAGE_ID, {
      // Monaco only supports single character trigger characters
      triggerCharacters: ['{'],
      provideCompletionItems: (model, position, _context, _token): ProviderResult<monaco.languages.CompletionList> => this.provideFunctionCompletions(model, position),
    });

    monaco.languages.registerCompletionItemProvider(PROMPT_TEMPLATE_LANGUAGE_ID, {
      // Monaco only supports single character trigger characters
      triggerCharacters: ['{'],
      provideCompletionItems: (model, position, _context, _token): ProviderResult<monaco.languages.CompletionList> => this.provideVariableCompletions(model, position),
    });
    monaco.languages.registerCompletionItemProvider(PROMPT_TEMPLATE_LANGUAGE_ID, {
      // Monaco only supports single character trigger characters
      triggerCharacters: ['{', ':'],
      provideCompletionItems: (model, position, _context, _token): ProviderResult<monaco.languages.CompletionList> => this.provideVariableWithArgCompletions(model, position),
    });

    const require = createRequire(import.meta.url);
    const textmateGrammar = require('../../data/prompttemplate.tmLanguage.json');
    const grammarDefinitionProvider: GrammarDefinitionProvider = {
      getGrammarDefinition(): Promise<GrammarDefinition> {
        return Promise.resolve({
          format: 'json',
          content: textmateGrammar,
        });
      },
    };
    registry.registerTextmateGrammarScope(PROMPT_TEMPLATE_TEXTMATE_SCOPE, grammarDefinitionProvider);

    registry.mapLanguageIdToTextmateGrammar(PROMPT_TEMPLATE_LANGUAGE_ID, PROMPT_TEMPLATE_TEXTMATE_SCOPE);
  }

  provideFunctionCompletions(model: monaco.editor.ITextModel, position: monaco.Position): ProviderResult<monaco.languages.CompletionList> {
    return this.getSuggestions(
      model,
      position,
      '~{',
      this.toolInvocationRegistry.getAllFunctions(),
      monaco.languages.CompletionItemKind.Function,
      tool => tool.id,
      tool => tool.name,
      tool => tool.description ?? '',
    );
  }

  provideVariableCompletions(model: monaco.editor.ITextModel, position: monaco.Position): ProviderResult<monaco.languages.CompletionList> {
    return this.getSuggestions(
      model,
      position,
      '{{',
      this.variableService.getVariables(),
      monaco.languages.CompletionItemKind.Variable,
      variable => variable.args?.some(arg => !arg.isOptional) ? variable.name + PromptText.VARIABLE_SEPARATOR_CHAR : variable.name,
      variable => variable.name,
      variable => variable.description ?? '',
    );
  }

  async provideVariableWithArgCompletions(model: monaco.editor.ITextModel, position: monaco.Position): Promise<monaco.languages.CompletionList> {
    // Get the text of the current line up to the cursor position
    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // Regex that captures the variable name in contexts like {{, {{{, {{varname, {{{varname, {{varname:, or {{{varname:
    const variableRegex = /(?:\{\{\{|\{\{)([\w-]+)?:?/;
    const match = textUntilPosition.match(variableRegex);

    if (!match) {
      return { suggestions: [] };
    }

    const currentVariableName = match[1];
    const hasColonSeparator = textUntilPosition.includes(`${currentVariableName}:`);

    const variables = this.variableService.getVariables();
    const suggestions: monaco.languages.CompletionItem[] = [];

    for (const variable of variables) {
      // If we have a variable:arg pattern, only process the matching variable
      if (hasColonSeparator && variable.name !== currentVariableName) {
        continue;
      }

      const provider = await this.variableService.getArgumentCompletionProvider(variable.name);
      if (provider) {
        const items = await provider(model, position, '{');
        if (items) {
          suggestions.push(...items.map(item => ({
            ...item,
          })));
        }
      }
    }

    return { suggestions };
  }

  getCompletionRange(model: monaco.editor.ITextModel, position: monaco.Position, triggerCharacters: string): monaco.Range | undefined {
    // Check if the characters before the current position are the trigger characters
    const lineContent = model.getLineContent(position.lineNumber);
    const triggerLength = triggerCharacters.length;
    const charactersBefore = lineContent.substring(
      position.column - triggerLength - 1,
      position.column - 1,
    );

    if (charactersBefore !== triggerCharacters) {
      // Do not return agent suggestions if the user didn't just type the trigger characters
      return undefined;
    }

    // Calculate the range from the position of the trigger characters
    const wordInfo = model.getWordUntilPosition(position);
    return new monaco.Range(
      position.lineNumber,
      wordInfo.startColumn,
      position.lineNumber,
      position.column,
    );
  }

  private getSuggestions<T>(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    triggerChars: string,
    items: T[],
    kind: monaco.languages.CompletionItemKind,
    getId: (item: T) => string,
    getName: (item: T) => string,
    getDescription: (item: T) => string,
  ): ProviderResult<monaco.languages.CompletionList> {
    const completionRange = this.getCompletionRange(model, position, triggerChars);
    if (completionRange === undefined) {
      return { suggestions: [] };
    }
    const suggestions = items.map(item => ({
      insertText: getId(item),
      kind,
      label: getName(item),
      range: completionRange,
      detail: getDescription(item),
    }));
    return { suggestions };
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(DISCARD_PROMPT_TEMPLATE_CUSTOMIZATIONS, {
      isVisible: (widget: Widget) => this.isPromptTemplateWidget(widget),
      isEnabled: (widget: EditorWidget) => this.canDiscard(widget),
      execute: (widget: EditorWidget) => this.discard(widget),
    });
  }

  protected isPromptTemplateWidget(widget: Widget): boolean {
    // if (widget instanceof EditorWidget) {
    //   return PROMPT_TEMPLATE_LANGUAGE_ID === widget.editor.document.languageId;
    // }
    return false;
  }

  protected canDiscard(widget: EditorWidget): boolean {
    const resourceUri = widget.editor.uri;
    const id = this.customizationService.getTemplateIDFromURI(resourceUri);
    if (id === undefined) {
      return false;
    }
    const rawPrompt = this.promptService.getRawPrompt(id);
    const defaultPrompt = this.promptService.getDefaultRawPrompt(id);
    return rawPrompt?.template !== defaultPrompt?.template;
  }

  protected async discard(widget: EditorWidget): Promise<void> {
    const resourceUri = widget.editor.uri;
    const id = this.customizationService.getTemplateIDFromURI(resourceUri);
    if (id === undefined) {
      return;
    }
    const defaultPrompt = this.promptService.getDefaultRawPrompt(id);
    if (defaultPrompt === undefined) {
      return;
    }

    const source: string = widget.editor.document.getText();
    const lastLine = widget.editor.document.getLineContent(widget.editor.document.lineCount);

    const replaceOperation: ReplaceOperation = {
      range: {
        start: {
          line: 0,
          character: 0,
        },
        end: {
          line: widget.editor.document.lineCount,
          character: lastLine.length,
        },
      },
      text: defaultPrompt.template,
    };

    await widget.editor.replaceText({
      source,
      replaceOperations: [replaceOperation],
    });
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: DISCARD_PROMPT_TEMPLATE_CUSTOMIZATIONS.id,
      command: DISCARD_PROMPT_TEMPLATE_CUSTOMIZATIONS.id,
      tooltip: 'Discard Customizations',
    });
  }
}
