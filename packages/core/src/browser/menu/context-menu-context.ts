import { InjectableService, OS, createServiceDecorator } from '@gepick/core/common';

export class ContextMenuContext extends InjectableService {
  protected _altPressed = false;
  get altPressed(): boolean {
    return this._altPressed;
  }

  protected setAltPressed(altPressed: boolean): void {
    this._altPressed = altPressed;
  }

  resetAltPressed(): void {
    this.setAltPressed(false);
  }

  constructor() {
    super();
    document.addEventListener('keydown', e => this.setAltPressed(e.altKey || (OS.type() !== OS.Type.OSX && e.shiftKey)), true);
    document.addEventListener('keyup', () => this.resetAltPressed(), true);
  }
}
export const IContextMenuContext = createServiceDecorator<IContextMenuContext>(ContextMenuContext.name);
export type IContextMenuContext = ContextMenuContext;
