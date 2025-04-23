// *****************************************************************************
// Copyright (C) 2024 TypeFox and others.
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

import { InjectableService, createServiceDecorator } from "@gepick/core/common";

export interface PreferenceLayout {
  id: string;
  label: string;
  children?: PreferenceLayout[];
  settings?: string[];
}

export const COMMONLY_USED_SECTION_PREFIX = 'commonly-used';

export const COMMONLY_USED_LAYOUT = {
  id: COMMONLY_USED_SECTION_PREFIX,
  label: 'Commonly Used',
  settings: [
    'files.autoSave',
    'editor.fontSize',
    'editor.fontFamily',
    'editor.tabSize',
    'editor.renderWhitespace',
    'editor.cursorStyle',
    'editor.multiCursorModifier',
    'editor.insertSpaces',
    'editor.wordWrap',
    'files.exclude',
    'files.associations',
  ],
};

export const DEFAULT_LAYOUT: PreferenceLayout[] = [
  {
    id: 'plugin',
    label: 'Plugin',
    settings: ['plugin.registry', 'plugin.proxy'],
  },
  {
    id: 'theme',
    label: 'Theme',
    settings: ['theme.background', 'theme.icon'],
  },
];

export class PreferenceLayoutProvider extends InjectableService {
  getLayout(): PreferenceLayout[] {
    return DEFAULT_LAYOUT;
  }

  getCommonlyUsedLayout(): PreferenceLayout {
    return COMMONLY_USED_LAYOUT;
  }

  hasCategory(id: string): boolean {
    return [...this.getLayout(), this.getCommonlyUsedLayout()].some(e => e.id === id);
  }

  getLayoutForPreference(preferenceId: string): PreferenceLayout | undefined {
    const layout = this.getLayout();
    for (const section of layout) {
      const item = this.findItemInSection(section, preferenceId);
      if (item) {
        return item;
      }
    }
    return undefined;
  }

  protected findItemInSection(section: PreferenceLayout, preferenceId: string): PreferenceLayout | undefined {
    // First check whether any of its children match the preferenceId.
    if (section.children) {
      for (const child of section.children) {
        const item = this.findItemInSection(child, preferenceId);
        if (item) {
          return item;
        }
      }
    }
    // Then check whether the section itself matches the preferenceId.
    if (section.settings) {
      for (const setting of section.settings) {
        if (this.matchesSetting(preferenceId, setting)) {
          return section;
        }
      }
    }
    return undefined;
  }

  protected matchesSetting(preferenceId: string, setting: string): boolean {
    if (setting.includes('*')) {
      return this.createRegExp(setting).test(preferenceId);
    }
    return preferenceId === setting;
  }

  protected createRegExp(setting: string): RegExp {
    return new RegExp(`^${setting.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  }
}

export const IPreferenceLayoutProvider = createServiceDecorator<IPreferenceLayoutProvider>(PreferenceLayoutProvider.name);
export type IPreferenceLayoutProvider = PreferenceLayoutProvider;
