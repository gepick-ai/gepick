import { Mixin } from "ts-mixer";
import { Widget } from "@lumino/widgets";
import { Message } from "@lumino/messaging";
import PerfectScrollbar from 'perfect-scrollbar';
import { DisposableCollection, Emitter, Event, InjectableService, KeyCode, KeysOrKeyCodes, MaybePromise, toDisposable } from "@gepick/core/common";
import { WidgetUtilities } from "./widget-util";

export * from '@lumino/widgets';
export * from '@lumino/messaging';

export const DISABLED_CLASS = 'theia-mod-disabled';
export const EXPANSION_TOGGLE_CLASS = 'theia-ExpansionToggle';
export const CODICON_TREE_ITEM_CLASSES = WidgetUtilities.codiconArray('chevron-down');
export const COLLAPSED_CLASS = 'theia-mod-collapsed';
export const BUSY_CLASS = 'theia-mod-busy';
export const CODICON_LOADING_CLASSES = WidgetUtilities.codiconArray('loading');
export const SELECTED_CLASS = 'theia-mod-selected';
export const FOCUS_CLASS = 'theia-mod-focus';
export const PINNED_CLASS = 'theia-mod-pinned';
export const LOCKED_CLASS = 'theia-mod-locked';
export const DEFAULT_SCROLL_OPTIONS: PerfectScrollbar.Options = {
  suppressScrollX: true,
  minScrollbarLength: 35,
};

export class InjectableBaseWidget extends Mixin(Widget, InjectableService) {}

/**
 * 一个自定义的Widget必须继承并实现AbstractWidget的相关属性
 */
export abstract class AbstractWidget extends InjectableBaseWidget {
  protected readonly toDispose = new DisposableCollection();
  protected readonly toDisposeOnDetach = new DisposableCollection();
  protected scrollBar?: PerfectScrollbar;
  protected scrollOptions?: PerfectScrollbar.Options;

  protected readonly onScrollYReachEndEmitter = new Emitter<void>();
  readonly onScrollYReachEnd: Event<void> = this.onScrollYReachEndEmitter.event;
  protected readonly onScrollUpEmitter = new Emitter<void>();
  readonly onScrollUp: Event<void> = this.onScrollUpEmitter.event;
  protected readonly onDidChangeVisibilityEmitter = new Emitter<boolean>();
  readonly onDidChangeVisibility = this.onDidChangeVisibilityEmitter.event;
  protected readonly onDidDisposeEmitter = new Emitter<void>();
  readonly onDidDispose = this.onDidDisposeEmitter.event;

  override dispose(): void {
    if (this.isDisposed) {
      return;
    }

    super.dispose();
  }

  protected override onBeforeAttach(msg: Message): void {
    if (this.title.iconClass === '') {
      this.title.iconClass = 'no-icon';
    }
    super.onBeforeAttach(msg);
  }

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.createScrollBar();
  }

  protected override onBeforeDetach(msg: Message): void {
    this.toDisposeOnDetach.dispose();
    super.onBeforeDetach(msg);
  }

  protected override onAfterDetach(msg: Message): void {
    if (this.title.iconClass === 'no-icon') {
      this.title.iconClass = '';
    }
    super.onAfterDetach(msg);
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.updateScrollBar();
  }

  protected override onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.dispose();
  }

  private createScrollBar(): void {
    if (this.scrollOptions) {
      (async () => {
        const container = await this.getScrollContainer();
        container.style.overflow = 'hidden';
        this.scrollBar = new PerfectScrollbar(container, {
          suppressScrollX: true,
        });

        this.toDispose.push(toDisposable(async () => {
          if (this.scrollBar) {
            this.scrollBar.destroy();
            this.scrollBar = undefined;
          }

          // @ts-ignore
          // @ts-nocheck
          container.style.overflow = null;
        }));
      })();
    }
  }

  private updateScrollBar(): void {
    if (this.scrollBar) {
      this.scrollBar.update();
    }
  }

  protected getScrollContainer(): MaybePromise<HTMLElement> {
    return this.node;
  }

  protected addUpdateListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K): void {
    this.addEventListener(element, type, (e) => {
      this.update();
      e.preventDefault();
    });
  }

  protected addEventListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K, listener: WidgetUtilities.EventListenerOrEventListenerObject<K>): void {
    this.toDisposeOnDetach.push(WidgetUtilities.addEventListener(element, type, listener));
  }

  protected addKeyListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    keysOrKeyCodes: KeyCode.Predicate | KeysOrKeyCodes,
    action: (event: KeyboardEvent) => boolean | void | object,
    ...additionalEventTypes: K[]
  ): void {
    this.toDisposeOnDetach.push(WidgetUtilities.addKeyListener(element, keysOrKeyCodes, action, ...additionalEventTypes));
  }

  protected addClipboardListener<K extends 'cut' | 'copy' | 'paste'>(element: HTMLElement, type: K, listener: WidgetUtilities.EventListenerOrEventListenerObject<K>): void {
    this.toDisposeOnDetach.push(WidgetUtilities.addClipboardListener(element, type, listener));
  }
}
