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

import { Emitter, Event, InjectableService } from '../common';

/**
 * `SelectionProvider` is implemented by services to notify listeners about selection changes.
 */
export interface SelectionProvider<T> {
  onSelectionChanged: Event<T | undefined>;
}

/**
 * Singleton service that is used to share the current selection globally in a Theia application.
 * On each change of selection, subscribers are notified and receive the updated selection object.
 */
export class SelectionService extends InjectableService implements SelectionProvider<object | undefined> {
  private currentSelection: object | undefined;

  protected readonly onSelectionChangedEmitter = new Emitter<any>();
  readonly onSelectionChanged: Event<any> = this.onSelectionChangedEmitter.event;

  get selection(): object | undefined {
    return this.currentSelection;
  }

  set selection(selection: object | undefined) {
    this.currentSelection = selection;
    this.onSelectionChangedEmitter.fire(this.currentSelection);
  }
}
