// *****************************************************************************
// Copyright (C) 2021 Ericsson and others.
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

import { JSONValue } from '@gepick/core/browser';
import { Contribution, ICommandRegistry, interfaces } from '@gepick/core/common';
import { Preference, PreferencesCommands } from '../../util/preference-types';
import { PreferenceLeafNodeRenderer, PreferenceNodeRenderer } from './preference-node-renderer';
import { IPreferenceNodeRendererContribution, PreferenceLeafNodeRendererContribution } from './preference-node-renderer-creator';

export class PreferenceJSONLinkRenderer extends PreferenceLeafNodeRenderer<JSONValue, HTMLAnchorElement> {
  @ICommandRegistry protected readonly commandRegistry: ICommandRegistry;

  protected createInteractable(parent: HTMLElement): void {
    const message = 'Edit in settings.json';
    const interactable = document.createElement('a');
    this.interactable = interactable;
    interactable.classList.add('theia-json-input');
    interactable.setAttribute('role', 'button');
    interactable.title = message;
    interactable.textContent = message;
    interactable.onclick = this.handleUserInteraction.bind(this);
    interactable.onkeydown = this.handleUserInteraction.bind(this);
    parent.appendChild(interactable);
  }

  protected getFallbackValue(): JSONValue {
    const node = this.preferenceNode;
    const type = Array.isArray(node.preference.data.type) ? node.preference.data.type[0] : node.preference.data.type;
    switch (type) {
      case 'object':
        return {};
      case 'array':
        return [];
      case 'null':
        return null;
      default: // Should all be handled by other input types.
        return '';
    }
  }

  protected doHandleValueChange(): void {
    this.updateInspection();
    this.updateModificationStatus();
  }

  protected handleUserInteraction(): void {
    this.commandRegistry.executeCommand(PreferencesCommands.OPEN_PREFERENCES_JSON_TOOLBAR.id, this.id);
  }
}

@Contribution(IPreferenceNodeRendererContribution)
export class PreferenceJSONLinkRendererContribution extends PreferenceLeafNodeRendererContribution {
  static ID = 'preference-json-link-renderer';
  id = PreferenceJSONLinkRendererContribution.ID;

  canHandleLeafNode(_node: Preference.LeafNode): number {
    return 1;
  }

  createLeafNodeRenderer(container: interfaces.Container): PreferenceNodeRenderer {
    return container.get(PreferenceJSONLinkRenderer.getServiceId());
  }
}
