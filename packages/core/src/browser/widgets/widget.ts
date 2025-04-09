import { Mixin } from "ts-mixer";
import { Widget } from "@lumino/widgets";
import { Message } from "@lumino/messaging";
import PerfectScrollbar from 'perfect-scrollbar';
import { DisposableStore, IDisposable, InjectableService, toDisposable } from "@gepick/core/common";
import { KeyCode, KeysOrKeyCodes } from "../keys";

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

export class BaseWidget extends Mixin(Widget, InjectableService) {}

export class InjectableBaseWidget extends BaseWidget {
  protected readonly toDispose = new DisposableStore();
  protected readonly toDisposeOnDetach = new DisposableStore();
  protected scrollBar?: PerfectScrollbar;
  protected scrollOptions?: PerfectScrollbar.Options;

  override dispose(): void {
    if (this.isDisposed) {
      return;
    }

    super.dispose();
  }

  protected override onBeforeAttach(msg: Message): void {
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

  protected getScrollContainer(): HTMLElement | Promise<HTMLElement> {
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
