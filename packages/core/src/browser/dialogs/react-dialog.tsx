import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { toDisposable } from '@gepick/core/common';
import { Message } from '../widget';
import { AbstractDialog, IDialogProps } from './dialogs';

export abstract class ReactDialog<T> extends AbstractDialog<T> {
  protected contentNodeRoot: Root;
  protected isMounted: boolean;

  constructor(
    @IDialogProps override readonly props: IDialogProps,
  ) {
    super(props);
    this.contentNodeRoot = createRoot(this.contentNode);
    this.isMounted = true;
    this.toDispose.push(toDisposable(() => {
      this.contentNodeRoot.unmount();
      this.isMounted = false;
    }));
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    if (!this.isMounted) {
      this.contentNodeRoot = createRoot(this.contentNode);
    }
    this.contentNodeRoot?.render(<>{this.render()}</>);
  }

  /**
     * Render the React widget in the DOM.
     * - If the widget has been previously rendered,
     * any subsequent calls will perform an update and only
     * change the DOM if absolutely necessary.
     */
  protected abstract render(): React.ReactNode;
}
