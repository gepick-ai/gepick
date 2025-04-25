// *****************************************************************************
// Copyright (C) 2020 Alibaba Inc. and others.
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

import { IServiceContainer, InjectableService, MenuPath, createServiceDecorator } from '@gepick/core/common';
import { SidebarMenuWidget } from './sidebar-menu-widget';

/**
 * The menu widget placed on the bottom of the sidebar.
 */
export class SidebarBottomMenuWidget extends SidebarMenuWidget {
  protected override onClick(e: React.MouseEvent<HTMLElement, MouseEvent>, menuPath: MenuPath): void {
    const button = e.currentTarget.getBoundingClientRect();
    this.contextMenuRenderer.render({
      menuPath,
      includeAnchorArg: false,
      anchor: {
        x: button.left + button.width,
        y: button.top + button.height,
      },
      context: e.currentTarget,
    });
  }
}
export const ISidebarBottomMenuWidget = createServiceDecorator<ISidebarBottomMenuWidget>(SidebarBottomMenuWidget.name);
export type ISidebarBottomMenuWidget = SidebarBottomMenuWidget;

export class SidebarBottomMenuWidgetFactory extends InjectableService {
  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createSidebarBottomMenuWidget() {
    return this.serviceContainer.get<ISidebarBottomMenuWidget>(ISidebarBottomMenuWidget);
  }
}

export const ISidebarBottomMenuWidgetFactory = createServiceDecorator<ISidebarBottomMenuWidgetFactory>(SidebarBottomMenuWidgetFactory.name);
export type ISidebarBottomMenuWidgetFactory = SidebarBottomMenuWidgetFactory;
