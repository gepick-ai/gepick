/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { Widget } from '@lumino/widgets';
import {
  InjectableService,
  createContribution,
} from '../../common';
import { IWidgetManager } from '../widgets';
import { ApplicationShell, IApplicationShell } from './shell';

export interface OpenViewArguments extends ApplicationShell.WidgetOptions {
  toggle?: boolean;
  activate?: boolean;
  reveal?: boolean;
}

export interface ViewContributionOptions {
  viewContainerId?: string;
  widgetId: string;
  widgetName: string;
  defaultWidgetOptions: ApplicationShell.WidgetOptions;
  toggleCommandId?: string;
  toggleKeybinding?: string;
}

/**
 * An abstract superclass for frontend contributions that add a view to the application shell.
 */
export abstract class AbstractViewContribution<T extends Widget> extends InjectableService {
  @IWidgetManager protected readonly widgetManager: IWidgetManager;
  @IApplicationShell protected readonly shell: IApplicationShell;

  constructor(protected options: ViewContributionOptions) {
    super();
  }

  get viewId(): string {
    return this.options.widgetId;
  }

  get viewLabel(): string {
    return this.options.widgetName;
  }

  get defaultViewOptions(): ApplicationShell.WidgetOptions {
    return this.options.defaultWidgetOptions;
  }

  get widget(): Promise<T> {
    return this.widgetManager.getOrCreateWidget<T>(this.options.widgetId);
  }

  tryGetWidget(): T | undefined {
    return this.widgetManager.tryGetWidget(this.options.widgetId);
  }

  async openView(args: Partial<OpenViewArguments> = {}): Promise<T> {
    const shell = this.shell;
    const widget = await this.widgetManager.getOrCreateWidget(this.options.viewContainerId || this.viewId);
    const tabBar = shell.getTabBarFor(widget);
    const area = shell.getAreaFor(widget);
    if (!tabBar) {
      // The widget is not attached yet, so add it to the shell
      const widgetArgs: OpenViewArguments = {
        ...this.defaultViewOptions,
        ...args,
      };
      await shell.addWidget(widget, widgetArgs);
    }
    else if (args.toggle && area && shell.isExpanded(area) && tabBar.currentTitle === widget.title) {
      // The widget is attached and visible, so collapse the containing panel (toggle)
      switch (area) {
        case 'left':
          await shell.collapsePanel(area);
          break;
        default:
          // The main area cannot be collapsed, so close the widget
          await this.closeView();
      }

      return this.widget;
    }

    if (widget.isAttached && args.activate) {
      await shell.activateWidget(this.viewId);
    }
    else if (widget.isAttached && args.reveal) {
      await shell.revealWidget(this.viewId);
    }

    return this.widget;
  }

  async closeView(): Promise<T | undefined> {
    const widget = await this.shell.closeWidget(this.viewId);
    return widget as T | undefined;
  }

  setupOptions(options: ViewContributionOptions) {
    this.options = options;
  }
}

export const [IViewContribution, IViewContributionProvider] = createContribution<IViewContribution>("ViewContribution");
export interface IViewContribution { initializeLayout: () => Promise<void> }
