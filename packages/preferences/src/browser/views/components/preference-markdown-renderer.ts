// *****************************************************************************
// Copyright (C) 2023 TypeFox and others.
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

import { ICommandRegistry, InjectableService, createServiceDecorator } from '@gepick/core/common';
import { markdownit } from "@gepick/core/browser";
import { IPreferenceTreeLabelProvider } from '../../util/preference-tree-label-provider';
import { IPreferenceTreeModel } from '../../preferences-tree-model';

export class PreferenceMarkdownRenderer extends InjectableService {
  protected _renderer?: markdownit;

  constructor(
    @IPreferenceTreeModel protected readonly model: IPreferenceTreeModel,
    @IPreferenceTreeLabelProvider protected readonly labelProvider: IPreferenceTreeLabelProvider,
    @ICommandRegistry protected readonly commandRegistry: ICommandRegistry,

  ) {
    super();
  }

  render(text: string): string {
    return this.getRenderer().render(text);
  }

  renderInline(text: string): string {
    return this.getRenderer().renderInline(text);
  }

  protected getRenderer(): markdownit {
    this._renderer ??= this.buildMarkdownRenderer();
    return this._renderer;
  }

  protected buildMarkdownRenderer(): markdownit {
    const engine = markdownit();
    const inlineCode = engine.renderer.rules.code_inline;

    engine.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const content = token.content;
      if (content.length > 2 && content.startsWith('#') && content.endsWith('#')) {
        const id = content.substring(1, content.length - 1);
        // First check whether there's a preference with the given ID
        const preferenceNode = this.model.getNodeFromPreferenceId(id);
        if (preferenceNode) {
          let name = this.labelProvider.getName(preferenceNode);
          const prefix = this.labelProvider.getPrefix(preferenceNode, true);
          if (prefix) {
            name = prefix + name;
          }
          return `<a title="${id}" href="preference:${id}">${name}</a>`;
        }
        // If no preference was found, check whether there's a command with the given ID
        const command = this.commandRegistry.getCommand(id);
        if (command) {
          const name = `${command.category ? `${command.category}: ` : ''}${command.label}`;
          return `<span class="command-link" title="${id}">${name}</span>`;
        }
        // If nothing was found, print a warning
        console.warn(`Linked preference "${id}" not found.`);
      }
      return inlineCode ? inlineCode(tokens, idx, options, env, self) : '';
    };
    return engine;
  }
}
export const IPreferenceMarkdownRenderer = createServiceDecorator<IPreferenceMarkdownRenderer>(PreferenceMarkdownRenderer.name);
export type IPreferenceMarkdownRenderer = PreferenceMarkdownRenderer;
