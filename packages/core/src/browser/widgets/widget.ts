import { Mixin } from "ts-mixer";
import { Widget } from "@lumino/widgets";
import { Message, MessageLoop } from "@lumino/messaging";
import PerfectScrollbar from 'perfect-scrollbar';
import { DisposableStore, Emitter, Event, IDisposable, InjectableService, KeyCode, KeysOrKeyCodes, MaybePromise, toDisposable } from "@gepick/core/common";

export * from '@lumino/widgets';
export * from '@lumino/messaging';

export const ACTION_ITEM = 'action-label';
export function codiconArray(name: string, actionItem = false): string[] {
  const array = ['codicon', `codicon-${name}`];
  if (actionItem) {
    array.push(ACTION_ITEM);
  }
  return array;
}
export function codicon(name: string, actionItem = false): string {
  return `codicon codicon-${name}${actionItem ? ` ${ACTION_ITEM}` : ''}`;
}

export const DISABLED_CLASS = 'theia-mod-disabled';
export const EXPANSION_TOGGLE_CLASS = 'theia-ExpansionToggle';
export const CODICON_TREE_ITEM_CLASSES = codiconArray('chevron-down');
export const COLLAPSED_CLASS = 'theia-mod-collapsed';
export const BUSY_CLASS = 'theia-mod-busy';
export const CODICON_LOADING_CLASSES = codiconArray('loading');
export const SELECTED_CLASS = 'theia-mod-selected';
export const FOCUS_CLASS = 'theia-mod-focus';
export const PINNED_CLASS = 'theia-mod-pinned';
export const LOCKED_CLASS = 'theia-mod-locked';
export const DEFAULT_SCROLL_OPTIONS: PerfectScrollbar.Options = {
  suppressScrollX: true,
  minScrollbarLength: 35,
};

/**
 * At a number of places in the code, we have effectively reimplemented Lumino's Widget.attach and Widget.detach,
 * but omitted the checks that Lumino expects to be performed for those operations. That is a bad idea, because it
 * means that we are telling widgets that they are attached or detached when not all the conditions that should apply
 * do apply. We should explicitly mark those locations so that we know where we should go fix them later.
 */
export namespace UnsafeWidgetUtilities {
  /**
   * Ordinarily, the following checks should be performed before detaching a widget:
   * It should not be the child of another widget
   * It should be attached and it should be a child of document.body
   */
  export function detach(widget: Widget): void {
    MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    widget.node.remove();
    MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
  };
  /**
   * @param ref The child of the host element to insert the widget before.
   * Ordinarily the following checks should be performed:
   * The widget should have no parent
   * The widget should not be attached, and its node should not be a child of document.body
   * The host should be a child of document.body
   * We often violate the last condition.
   */
  export function attach(widget: Widget, host: HTMLElement, ref: HTMLElement | null = null): void {
    MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    host.insertBefore(widget.node, ref);
    MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
  };
}

export class InjectableBaseWidget extends Mixin(Widget, InjectableService) {}

export class BaseWidget extends InjectableBaseWidget {
  protected readonly toDispose = new DisposableStore();
  protected readonly toDisposeOnDetach = new DisposableStore();
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

        this.toDispose.add(toDisposable(async () => {
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

  protected addEventListener<K extends keyof HTMLElementEventMap>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>): void {
    this.toDisposeOnDetach.add(addEventListener(element, type, listener));
  }

  protected addKeyListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    keysOrKeyCodes: KeyCode.Predicate | KeysOrKeyCodes,
    action: (event: KeyboardEvent) => boolean | void | object,
    ...additionalEventTypes: K[]
  ): void {
    this.toDisposeOnDetach.add(addKeyListener(element, keysOrKeyCodes, action, ...additionalEventTypes));
  }

  protected addClipboardListener<K extends 'cut' | 'copy' | 'paste'>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>): void {
    this.toDisposeOnDetach.add(addClipboardListener(element, type, listener));
  }
}

export function createIconButton(...classNames: string[]): HTMLSpanElement {
  const icon = document.createElement('i');
  icon.classList.add(...classNames);
  const button = document.createElement('span');
  button.tabIndex = 0;
  button.appendChild(icon);
  return button;
}

export type EventListener<K extends keyof HTMLElementEventMap> = (this: HTMLElement, event: HTMLElementEventMap[K]) => any;
export interface EventListenerObject<K extends keyof HTMLElementEventMap> {
  handleEvent: (evt: HTMLElementEventMap[K]) => void;
}
export namespace EventListenerObject {
  // tslint:disable-next-line:no-any
  export function is<K extends keyof HTMLElementEventMap>(listener: any | undefined): listener is EventListenerObject<K> {
    return !!listener && 'handleEvent' in listener;
  }
}
export type EventListenerOrEventListenerObject<K extends keyof HTMLElementEventMap> = EventListener<K> | EventListenerObject<K>;
export function addEventListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  listener: EventListenerOrEventListenerObject<K>,
  useCapture?: boolean,
): IDisposable {
  element.addEventListener(type, listener as any, useCapture);
  return toDisposable(() =>
    element.removeEventListener(type, listener as any),
  );
}

export function addKeyListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  keysOrKeyCodes: KeyCode.Predicate | KeysOrKeyCodes,
  action: (event: KeyboardEvent) => boolean | void | object,
  ...additionalEventTypes: K[]
): IDisposable {
  const toDispose = new DisposableStore();
  const keyCodePredicate = (() => {
    if (typeof keysOrKeyCodes === 'function') {
      return keysOrKeyCodes;
    }
    else {
      return (actual: KeyCode) => KeysOrKeyCodes.toKeyCodes(keysOrKeyCodes).some(k => k.equals(actual));
    }
  })();
  toDispose.add(addEventListener(element, 'keydown', (e) => {
    const kc = KeyCode.createKeyCode(e);
    if (keyCodePredicate(kc)) {
      const result = action(e);
      if (typeof result !== 'boolean' || result) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }));
  for (const type of additionalEventTypes) {
    toDispose.add(addEventListener(element, type, (e) => {
      // tslint:disable-next-line:no-any
      const event = (type as any).keydown;
      const result = action(event);
      if (typeof result !== 'boolean' || result) {
        e.stopPropagation();
        e.preventDefault();
      }
    }));
  }
  return toDispose;
}

export function addClipboardListener<K extends 'cut' | 'copy' | 'paste'>(element: HTMLElement, type: K, listener: EventListenerOrEventListenerObject<K>): IDisposable {
  const documentListener = (e: ClipboardEvent) => {
    const activeElement = document.activeElement;
    if (activeElement && element.contains(activeElement)) {
      if (EventListenerObject.is(listener)) {
        listener.handleEvent(e);
      }
      else {
        (listener as any).bind(element)(e);
      }
    }
  };
  document.addEventListener(type, documentListener);
  return toDisposable(() =>
    document.removeEventListener(type, documentListener),
  );
}

/**
 * Resolves when the given widget is detached and hidden.
 */
export function waitForClosed(widget: Widget): Promise<void> {
  return waitForVisible(widget, false, false);
}

function waitForVisible(widget: Widget, visible: boolean, attached?: boolean): Promise<void> {
  if ((typeof attached !== 'boolean' || widget.isAttached === attached)
    && (widget.isVisible === visible || (widget.node.style.visibility !== 'hidden') === visible)
  ) {
    return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
  }
  return new Promise((resolve) => {
    const waitFor = () => window.requestAnimationFrame(() => {
      if ((typeof attached !== 'boolean' || widget.isAttached === attached)
        && (widget.isVisible === visible || (widget.node.style.visibility !== 'hidden') === visible)) {
        window.requestAnimationFrame(() => resolve());
      }
      else {
        waitFor();
      }
    });
    waitFor();
  });
}

/**
 * Resolves when the given widget is attached and visible.
 */
export function waitForRevealed(widget: Widget): Promise<void> {
  return waitForVisible(widget, true, true);
}
