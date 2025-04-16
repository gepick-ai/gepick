// *****************************************************************************
// Copyright (C) 2017 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { Menu } from '../widgets';
import { ContextMenuAccess, ContextMenuRenderer, RenderContextMenuOptions, coordinateFromAnchor } from './context-menu-renderer';

export class BrowserContextMenuAccess extends ContextMenuAccess {
  constructor(
    public readonly menu: Menu,
  ) {
    super(menu);
  }
}

export class BrowserMainMenuFactory extends InjectableService {
  createContextMenu(..._args: any) {
    return {
      aboutToClose: { connect: (_fn: any) => {} },
      open: (..._args: any) => {},
    } as unknown as Menu;
  }
}
export const IBrowserMainMenuFactory = createServiceDecorator(BrowserMainMenuFactory.name);
export type IBrowserMainMenuFactory = BrowserMainMenuFactory;

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
