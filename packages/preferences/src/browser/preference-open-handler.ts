// *****************************************************************************
// Copyright (C) 2022 TypeFox and others.
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

import { OpenHandler, animationFrame } from "@gepick/core/browser";
import { InjectableService, URI } from "@gepick/core/common";
import { IPreferencesView } from "./view/preferences-view-contribution";

export class PreferenceOpenHandler extends InjectableService implements OpenHandler {
  readonly id = 'preference';

  constructor(
    @IPreferencesView protected readonly preferencesContribution: IPreferencesView,
  ) {
    super();
  }

  canHandle(uri: URI): number {
    return uri.scheme === this.id ? 500 : -1;
  }

  async open(uri: URI): Promise<boolean> {
    const preferencesWidget = await this.preferencesContribution.setupView();
    const selector = `li[data-pref-id="${uri.path.toString()}"]:not([data-node-id^="commonly-used@"])`;
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      if (element.classList.contains('hidden')) {
        // We clear the search term as we have clicked on a hidden preference
        await preferencesWidget.setSearchTerm('');
        await animationFrame();
      }
      element.scrollIntoView({
        block: 'center',
      });
      element.focus();
      return true;
    }
    return false;
  }
}
