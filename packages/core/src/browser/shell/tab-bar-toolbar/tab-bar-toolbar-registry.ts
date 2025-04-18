// *****************************************************************************
// Copyright (C) 2022 Ericsson and others.
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

import debounce from 'lodash.debounce';

import { DisposableStore, Emitter, Event, IContributionProvider, IDisposable, InjectableService, MenuPath, Optional, createContribution, createServiceDecorator, toDisposable } from '@gepick/core/common';
import { Widget } from '../../widget';
import { IContextKeyService } from '../../menu';
import { MenuDelegate, ReactTabBarToolbarItem, RenderedToolbarItem, TabBarToolbarItem } from './tab-bar-toolbar-types';

/**
 * Clients should implement this interface if they want to contribute to the tab-bar toolbar.
 */
export const TabBarToolbarContribution = Symbol('TabBarToolbarContribution');
/**
 * Representation of a tabbar toolbar contribution.
 */
export interface TabBarToolbarContribution {
  /**
   * Registers toolbar items.
   * @param registry the tabbar toolbar registry.
   */
  registerToolbarItems: (registry: TabBarToolbarRegistry) => void;
}

export function yes(): true { return true; }
const menuDelegateSeparator = '=@=';

export const [ITabBarToolbarContribution, ITabBarToolbarContributionProvider] = createContribution("TabBarToolbarContribution");
export type ITabBarToolbarContribution = TabBarToolbarContribution;
/**
 * Main, shared registry for tab-bar toolbar items.
 */
export class TabBarToolbarRegistry extends InjectableService {
  protected items = new Map<string, TabBarToolbarItem | ReactTabBarToolbarItem>();
  protected menuDelegates = new Map<string, MenuDelegate>();

  @IContextKeyService protected readonly contextKeyService: IContextKeyService;

  @Optional() @ITabBarToolbarContributionProvider protected readonly contributionProvider: IContributionProvider<ITabBarToolbarContribution>;

  protected readonly onDidChangeEmitter = new Emitter<void>();
  readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;
  // debounce in order to avoid to fire more than once in the same tick
  protected fireOnDidChange = debounce(() => this.onDidChangeEmitter.fire(undefined), 0);

  onStart(): void {
    const contributions = this.contributionProvider.getContributions();
    for (const contribution of contributions) {
      contribution.registerToolbarItems(this);
    }
  }

  /**
   * Registers the given item. Throws an error, if the corresponding command cannot be found or an item has been already registered for the desired command.
   *
   * @param item the item to register.
   */
  registerItem(item: RenderedToolbarItem | ReactTabBarToolbarItem): IDisposable {
    const { id } = item;
    if (this.items.has(id)) {
      throw new Error(`A toolbar item is already registered with the '${id}' ID.`);
    }
    this.items.set(id, item);
    this.fireOnDidChange();

    const disposables = [toDisposable(() => this.fireOnDidChange()), toDisposable(() => this.items.delete(id))];
    const toDispose = new DisposableStore();
    disposables.forEach(d => toDispose.add(d));
    if (item.onDidChange) {
      toDispose.add(item.onDidChange(() => this.fireOnDidChange()));
    }
    return toDispose;
  }

  /**
   * Returns an array of tab-bar toolbar items which are visible when the `widget` argument is the current one.
   *
   * By default returns with all items where the command is enabled and `item.isVisible` is `true`.
   */
  visibleItems(widget: Widget): Array<TabBarToolbarItem | ReactTabBarToolbarItem> {
    if (widget.isDisposed) {
      return [];
    }
    const result: Array<TabBarToolbarItem | ReactTabBarToolbarItem> = [];
    for (const item of this.items.values()) {
      if (this.isItemVisible(item, widget)) {
        result.push(item);
      }
    }
    // for (const delegate of this.menuDelegates.values()) {
    //   if (delegate.isVisible(widget)) {
    //     const menu = this.menuRegistry.getMenu(delegate.menuPath);
    //     for (const child of menu.children) {
    //       if (!child.when || this.contextKeyService.match(child.when, widget.node)) {
    //         if (child.children) {
    //           for (const grandchild of child.children) {
    //             if (!grandchild.when || this.contextKeyService.match(grandchild.when, widget.node)) {
    //               const menuPath = this.menuRegistry.getPath(grandchild);
    //               result.push(new ToolbarMenuNodeWrapper(grandchild, child.id, delegate.menuPath, menuPath));
    //             }
    //           }
    //         }
    //         else if (child.command) {
    //           const menuPath = this.menuRegistry.getPath(child);
    //           result.push(new ToolbarMenuNodeWrapper(child, undefined, delegate.menuPath, menuPath));
    //         }
    //       }
    //     }
    //   }
    // }
    return result;
  }

  /**
   * Query whether a toolbar `item` should be shown in the toolbar.
   * This implementation delegates to item-specific checks according to their type.
   *
   * @param item a menu toolbar item
   * @param widget the widget that is updating the toolbar
   * @returns `false` if the `item` should be suppressed, otherwise `true`
   */
  protected isItemVisible(item: TabBarToolbarItem | ReactTabBarToolbarItem, widget: Widget): boolean {
    if (!this.isConditionalItemVisible(item, widget)) {
      return false;
    }

    // if (item.command && !this.commandRegistry.isVisible(item.command, widget)) {
    //   return false;
    // }
    if (item.menuPath && !this.isNonEmptyMenu(item, widget)) {
      return false;
    }

    // The item is not vetoed. Accept it
    return true;
  }

  /**
   * Query whether a conditional toolbar `item` should be shown in the toolbar.
   * This implementation delegates to the `item`'s own intrinsic conditionality.
   *
   * @param item a menu toolbar item
   * @param widget the widget that is updating the toolbar
   * @returns `false` if the `item` should be suppressed, otherwise `true`
   */
  protected isConditionalItemVisible(item: TabBarToolbarItem, widget: Widget): boolean {
    if (item.isVisible && !item.isVisible(widget)) {
      return false;
    }
    if (item.when && !this.contextKeyService.match(item.when, widget.node)) {
      return false;
    }
    return true;
  }

  /**
   * Query whether a menu toolbar `item` should be shown in the toolbar.
   * This implementation returns `false` if the `item` does not have any actual menu to show.
   *
   * @param item a menu toolbar item
   * @param widget the widget that is updating the toolbar
   * @returns `false` if the `item` should be suppressed, otherwise `true`
   */
  isNonEmptyMenu(item: TabBarToolbarItem, _widget: Widget | undefined): boolean {
    if (!item.menuPath) {
      return false;
    }
    // const menu = this.menuRegistry.getMenu(item.menuPath);
    // const isVisible: (node: MenuNode) => boolean = node =>
    //   node.children?.length
    //   // Either the node is a sub-menu that has some visible child ...
    //     ? node.children?.some(isVisible)
    //   // ... or there is a command ...
    //     : !!node.command
    //       // ... that is visible ...
    //       && this.commandRegistry.isVisible(node.command, widget)
    //       // ... and a "when" clause does not suppress the menu node.
    //       && (!node.when || this.contextKeyService.match(node.when, widget?.node));

    return false;
  }

  unregisterItem(itemOrId: TabBarToolbarItem | ReactTabBarToolbarItem | string): void {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    if (this.items.delete(id)) {
      this.fireOnDidChange();
    }
  }

  registerMenuDelegate(_menuPath: MenuPath, _when?: ((widget: Widget) => boolean)): IDisposable {
    return { dispose: () => {} };
  }

  unregisterMenuDelegate(menuPath: MenuPath): void {
    if (this.menuDelegates.delete(this.toElementId(menuPath))) {
      this.fireOnDidChange();
    }
  }

  /**
   * Generate a single ID string from a menu path that
   * is likely to be unique amongst the items in the toolbar.
   *
   * @param menuPath a menubar path
   * @returns a likely unique ID based on the path
   */
  toElementId(menuPath: MenuPath): string {
    return menuPath.join(menuDelegateSeparator);
  }
}

export const ITabBarToolbarRegistry = createServiceDecorator(TabBarToolbarRegistry.name);
export type ITabBarToolbarRegistry = TabBarToolbarRegistry;
