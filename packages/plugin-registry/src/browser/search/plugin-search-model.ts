// *****************************************************************************
// Copyright (C) 2020 TypeFox and others.
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

import { Emitter, InjectableService, createServiceDecorator } from "@gepick/core/common";

export enum PluginSearchMode {
  Initial,
  None,
  Search,
  Installed,
  Builtin,
  Recommended,
}

export const BUILTIN_QUERY = '@builtin';
export const INSTALLED_QUERY = '@installed';
export const RECOMMENDED_QUERY = '@recommended';

export class PluginSearchModel extends InjectableService {
  protected readonly _onDidChangeQuery = new Emitter<string>();
  readonly onDidChangeQuery = this._onDidChangeQuery.event;

  protected readonly specialQueries = new Map<string, PluginSearchMode>([
    [BUILTIN_QUERY, PluginSearchMode.Builtin],
    [INSTALLED_QUERY, PluginSearchMode.Installed],
    [RECOMMENDED_QUERY, PluginSearchMode.Recommended],
  ]);

  protected _query = '';

  set query(query: string) {
    if (this._query === query) {
      return;
    }

    this._query = query;
    this._onDidChangeQuery.fire(this._query);
  }

  get query(): string {
    return this._query;
  }

  getModeForQuery(): PluginSearchMode {
    return this.query
      ? this.specialQueries.get(this.query) ?? PluginSearchMode.Search
      : PluginSearchMode.None;
  }
}

export const IPluginSearchModel = createServiceDecorator<IPluginSearchModel>(PluginSearchModel.name);
export type IPluginSearchModel = PluginSearchModel;
