// *****************************************************************************
// Copyright (C) 2018 Red Hat, Inc. and others.
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

import { Command, ICommandRegistry, IMenuModelRegistry, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { ILabelProvider, WidgetUtilities } from "@gepick/core/browser";
import { PreferenceScope } from "../preference-scope";
import { Preference, PreferenceMenus } from "./preference-types";

/**
 * @deprecated since 1.17.0 moved to PreferenceMenus namespace.
 */
export const FOLDER_SCOPE_MENU_PATH = PreferenceMenus.FOLDER_SCOPE_MENU_PATH;

/**
 * @deprecated since 1.17.0. This work is now done in the PreferenceScopeTabbarWidget.
 */
export class PreferenceScopeCommandManager extends InjectableService {
  @ICommandRegistry protected readonly commandRegistry: ICommandRegistry;
  @IMenuModelRegistry protected readonly menuModelRegistry: IMenuModelRegistry;
  @ILabelProvider protected readonly labelProvider: ILabelProvider;

  protected foldersAsCommands: Command[] = [];

  createFolderWorkspacesMenu(
    folderWorkspaces: any[],
    currentFolderURI?: string,
  ): void {
    this.foldersAsCommands.forEach((folderCommand) => {
      this.menuModelRegistry.unregisterMenuAction(folderCommand, FOLDER_SCOPE_MENU_PATH);
      this.commandRegistry.unregisterCommand(folderCommand);
    });
    this.foldersAsCommands.length = 0;

    folderWorkspaces.forEach((folderWorkspace) => {
      const folderLabel = this.labelProvider.getName(folderWorkspace.resource);

      const iconClass = currentFolderURI === folderWorkspace.resource.toString() ? WidgetUtilities.codicon('pass') : '';
      const newFolderAsCommand = {
        id: `preferenceScopeCommand:${folderWorkspace.resource.toString()}`,
        label: folderLabel,
        iconClass,
      };

      this.foldersAsCommands.push(newFolderAsCommand);

      this.commandRegistry.registerCommand(newFolderAsCommand, {
        isVisible: (_callback: any, check: any) => check === 'from-tabbar',
        isEnabled: (_callback: any, check: any) => check === 'from-tabbar',
        execute: (callback: (scopeDetails: Preference.SelectedScopeDetails) => void) => {
          callback({ scope: PreferenceScope.Folder, uri: folderWorkspace.resource.toString(), activeScopeIsFolder: true });
        },
      });

      this.menuModelRegistry.registerMenuAction(FOLDER_SCOPE_MENU_PATH, {
        commandId: newFolderAsCommand.id,
        label: newFolderAsCommand.label,
      });
    });
  }
}
export const IPreferenceScopeCommandManager = createServiceDecorator<IPreferenceScopeCommandManager>(PreferenceScopeCommandManager.name);
export type IPreferenceScopeCommandManager = PreferenceScopeCommandManager;
