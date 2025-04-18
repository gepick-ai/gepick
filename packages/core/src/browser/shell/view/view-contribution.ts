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
} from '@gepick/core/common';
import { IWidgetManager } from '../../widget';
import { IShell, Shell } from '../shell';

export interface OpenViewArguments extends Shell.WidgetOptions {
  toggle?: boolean;
  activate?: boolean;
  reveal?: boolean;
}

export interface ViewContributionOptions {
  viewContainerId?: string;
  widgetId: string;
  widgetName: string;
  defaultWidgetOptions: Shell.WidgetOptions;
  toggleCommandId?: string;
  toggleKeybinding?: string;
}

/**
 * An abstract superclass for frontend contributions that add a view to the application shell.
 */
export abstract class AbstractView<T extends Widget> extends InjectableService {
  @IWidgetManager protected readonly widgetManager: IWidgetManager;
  @IShell protected readonly shell: IShell;

  constructor(protected options: ViewContributionOptions) {
    super();
  }

  get viewId(): string {
    return this.options.widgetId;
  }

  get viewLabel(): string {
    return this.options.widgetName;
  }

  get defaultViewOptions(): Shell.WidgetOptions {
    return this.options.defaultWidgetOptions;
  }

  get widget(): Promise<T> {
    return this.widgetManager.getOrCreateWidget<T>(this.options.widgetId);
  }

  tryGetWidget(): T | undefined {
    return this.widgetManager.tryGetWidget(this.options.widgetId);
  }

  async setupView(args: Partial<OpenViewArguments> = {}): Promise<T> {
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
        case 'left':{
          await shell.collapsePanel(area);
          break;
        }
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

export const [IView, IViewProvider] = createContribution<IView>("View");
/**
 * 注册View视图并将其连接到Application Shell。注册View的时候：
 * - 通过constructor构造参数告诉App往Shell加入哪个Widget，放在Shell的哪个位置等信息。
 * - 通过实现initializeLayout方法，在其里头调用setupView，结果就是Application启动时调用widgetManager获取到对应Widget，并向shell添加相关widget。
 */
export interface IView {
  /**
   * 初始化Shell Layout，在这个阶段你可以注册自己的View视图
   */
  onShellLayoutInit: () => Promise<void>;
}
