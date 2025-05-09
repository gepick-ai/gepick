import { createServiceDecorator } from '@gepick/core/common';
import { Menu } from '../widget';
import { ContextMenuAccess, ContextMenuRenderer, RenderContextMenuOptions, coordinateFromAnchor } from './context-menu-renderer';
import { IBrowserMainMenuFactory } from './browser-menu-plugin';

export class BrowserContextMenuAccess extends ContextMenuAccess {
  constructor(
    public readonly menu: Menu,
  ) {
    super(menu);
  }
}

export class BrowserContextMenuRenderer extends ContextMenuRenderer {
  constructor(
    @IBrowserMainMenuFactory private menuFactory: IBrowserMainMenuFactory,
  ) {
    super();
  }

  protected doRender({ menuPath, anchor, args, onHide, context, contextKeyService, skipSingleRootNode }: RenderContextMenuOptions): ContextMenuAccess {
    const contextMenu = this.menuFactory.createContextMenu(menuPath, args, context, contextKeyService, skipSingleRootNode);
    const { x, y } = coordinateFromAnchor(anchor);
    if (onHide) {
      contextMenu.aboutToClose.connect(() => onHide!());
    }
    contextMenu.open(x, y, { host: context?.ownerDocument.body });
    return new BrowserContextMenuAccess(contextMenu);
  }
}
export const IContextMenuRenderer = createServiceDecorator<IContextMenuRenderer>(BrowserContextMenuRenderer.name);
export type IContextMenuRenderer = BrowserContextMenuRenderer;
