import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Unmanaged, toDisposable } from '@gepick/core/common';
import { AbstractWidget, Message, Widget } from './abstract-widget';

/**
 * 一个自定义的React Widget必须继承并实现AbstractReactWidget的相关属性
 */
export abstract class AbstractReactWidget extends AbstractWidget {
  protected nodeRoot: Root;

  constructor(@Unmanaged() options?: Widget.IOptions) {
    super(options);

    this.scrollOptions = {
      suppressScrollX: true,
      minScrollbarLength: 35,
    };
    this.nodeRoot = createRoot(this.node);
    this.toDispose.push(toDisposable(() => this.nodeRoot.unmount()));
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
