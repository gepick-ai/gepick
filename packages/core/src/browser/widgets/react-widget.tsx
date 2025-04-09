import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { toDisposable } from '@gepick/core/common';
import { InjectableBaseWidget, Message } from './widget';

export abstract class InjectableReactWidget extends InjectableBaseWidget {
  protected nodeRoot: Root;

  constructor() {
    super();

    this.scrollOptions = {
      suppressScrollX: true,
      minScrollbarLength: 35,
    };
    this.nodeRoot = createRoot(this.node);
    this.toDispose.add(toDisposable(() => this.nodeRoot.unmount()));
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    if (!this.isDisposed) {
      this.nodeRoot.render(<React.Fragment>{this.render()}</React.Fragment>);
    }
  }

  /**
   * Render the React widget in the DOM.
   * - If the widget has been previously rendered,
   * any subsequent calls will perform an update and only
   * change the DOM if absolutely necessary.
   */
  protected abstract render(): React.ReactNode;
}
