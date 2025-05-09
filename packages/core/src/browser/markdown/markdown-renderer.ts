import DOMPurify from 'dompurify';
import markdownit from 'markdown-it';
import { Disposable, DisposableGroup, IDisposable, InjectableService, MarkdownString, PostConstruct, createServiceDecorator } from '@gepick/core/common';
import { ILabelParser } from '../label';
import { WidgetUtilities } from '../widget';

// #region Copied from Copied from https://github.com/microsoft/vscode/blob/7d9b1c37f8e5ae3772782ba3b09d827eb3fdd833/src/vs/base/browser/formattedTextRenderer.ts
export interface ContentActionHandler {
  callback: (content: string, event?: MouseEvent | KeyboardEvent) => void;
  readonly disposables: DisposableGroup;
}

export interface FormattedTextRenderOptions {
  readonly className?: string;
  readonly inline?: boolean;
  readonly actionHandler?: ContentActionHandler;
  readonly renderCodeSegments?: boolean;
}

// #endregion

// #region Copied from Copied from https://github.com/microsoft/vscode/blob/7d9b1c37f8e5ae3772782ba3b09d827eb3fdd833/src/vs/base/browser/markdownRenderer.ts

export interface MarkdownRenderResult extends IDisposable {
  element: HTMLElement;
}

export interface MarkdownRenderOptions extends FormattedTextRenderOptions {
  readonly codeBlockRenderer?: (languageId: string, value: string) => Promise<HTMLElement>;
  readonly asyncRenderCallback?: () => void;
}

// #endregion

/** Use this directly if you aren't worried about circular dependencies in the Shell */
export const MarkdownRenderer = Symbol('MarkdownRenderer');
export interface MarkdownRenderer {
  render: (markdown: MarkdownString | undefined, options?: MarkdownRenderOptions) => MarkdownRenderResult;
}

export class MarkdownRendererImpl extends InjectableService implements MarkdownRenderer {
  @ILabelParser protected readonly labelParser: ILabelParser;
  protected readonly markdownIt = markdownit();
  protected resetRenderer: Disposable | undefined;

  @PostConstruct()
  protected init(): void {
    this.markdownItPlugin();
  }

  render(markdown: MarkdownString | undefined, _options?: MarkdownRenderOptions): MarkdownRenderResult {
    const host = document.createElement('div');
    if (markdown) {
      const html = this.markdownIt.render(markdown.value);
      host.innerHTML = DOMPurify.sanitize(html, {
        ALLOW_UNKNOWN_PROTOCOLS: true, // DOMPurify usually strips non http(s) links from hrefs
      });
    }
    return { element: host, dispose: () => { } };
  }

  protected markdownItPlugin(): void {
    this.markdownIt.renderer.rules.text = (tokens, idx) => {
      const content = tokens[idx].content;
      return this.labelParser.parse(content).map((chunk) => {
        if (typeof chunk === 'string') {
          return chunk;
        }
        return `<i class="${WidgetUtilities.codicon(chunk.name)} ${chunk.animation ? `fa-${chunk.animation}` : ''} icon-inline"></i>`;
      }).join('');
    };
  }
}
export const IMarkdownRenderer = createServiceDecorator<IMarkdownRenderer>(MarkdownRendererImpl.name);
export type IMarkdownRenderer = MarkdownRendererImpl;
