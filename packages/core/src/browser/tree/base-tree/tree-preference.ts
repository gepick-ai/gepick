// *****************************************************************************
// Copyright (C) 2024 STMicroelectronics and others.
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

import { Module, ServiceModule, createServiceDecorator } from "@gepick/core/common";
import { AbstractPreferencesProxy, AbstractPreferencesSchemaPart } from "../../preferences";

export const PREFERENCE_NAME_TREE_INDENT = 'workbench.tree.indent';

export class TreePreferencesSchemaPart extends AbstractPreferencesSchemaPart {
  constructor() {
    super({
      type: 'object',
      properties: {
        [PREFERENCE_NAME_TREE_INDENT]: {
          description: 'Controls tree indentation in pixels.',
          type: 'number',
          default: 8,
          minimum: 4,
          maximum: 40,
        },
      },
    });
  }
}

export const ITreePreferencesSchema = createServiceDecorator<ITreePreferencesSchema>(TreePreferencesSchemaPart.name);
export type ITreePreferencesSchema = TreePreferencesSchemaPart;

export namespace TreePreferencesService {
  export interface IProperties {
    [PREFERENCE_NAME_TREE_INDENT]: number;
  }
}

export class TreePreferencesService extends AbstractPreferencesProxy<TreePreferencesService.IProperties> {
  constructor(
      @ITreePreferencesSchema protected readonly treePreferencesSchema: ITreePreferencesSchema,
  ) {
    super(treePreferencesSchema);
  }
}

export const ITreePreferencesService = createServiceDecorator<ITreePreferencesService>(TreePreferencesService.name);
export type ITreePreferencesService = TreePreferencesService;

@Module({
  services: [
    TreePreferencesSchemaPart,
    TreePreferencesService,
  ],
})
export class TreePreferencesModule extends ServiceModule {}
