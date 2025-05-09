import { ReactNode } from 'react';
import { unmanaged } from 'inversify';
import { Emitter, Event, InjectableService, MaybePromise, isObject } from '@gepick/core/common';
import { TreeWidget } from '../base-tree';

export interface TreeElement {
  /** default: parent id + position among siblings */
  readonly id?: number | string | undefined;
  /** default: true */
  readonly visible?: boolean;
  render: (host: TreeWidget) => ReactNode;
  open?: () => MaybePromise<any>;
}

export interface CompositeTreeElement extends TreeElement {
  /** default: true */
  readonly hasElements?: boolean;
  getElements: () => MaybePromise<IterableIterator<TreeElement>>;
  expandByDefault?: () => boolean;
}
export namespace CompositeTreeElement {
  export function is(element: unknown): element is CompositeTreeElement {
    return isObject(element) && 'getElements' in element;
  }
  export function hasElements(element: unknown): element is CompositeTreeElement {
    return is(element) && element.hasElements !== false;
  }
}

export abstract class TreeSource extends InjectableService {
  protected readonly _onDidChange = this._register(new Emitter<void>());
  readonly onDidChange: Event<void> = this._onDidChange.event;

  readonly id: string | undefined;
  readonly placeholder: string | undefined;

  constructor(@unmanaged() options: TreeSourceOptions = {}) {
    super();
    this.id = options.id;
    this.placeholder = options.placeholder;
  }

  abstract getElements(): MaybePromise<IterableIterator<TreeElement>>;
}
export interface TreeSourceOptions {
  id?: string;
  placeholder?: string;
}
