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

import { interfaces } from "inversify";
import { Widget } from '@lumino/widgets';
import { h } from "@lumino/virtualdom";
import {
  Contribution,
  IServiceContainer,
  InjectableService,
  Module,
  PostConstruct,
  ServiceModule,
  createServiceDecorator,
} from '../../common';
import { IWidgetFactory, IWidgetManager, WidgetManager } from '../widgets/widget-manager';
import { InjectableBaseWidget, Message, VirtualRenderer } from "../widgets";
import { ApplicationShell1, IApplicationShell } from './application-shell';

export interface OpenViewArguments extends ApplicationShell1.WidgetOptions {
  toggle?: boolean;
  activate?: boolean;
  reveal?: boolean;
}

export interface ViewContributionOptions {
  widgetId: string;
  widgetName: string;
  defaultWidgetOptions: ApplicationShell1.WidgetOptions;
  toggleCommandId?: string;
  toggleKeybinding?: string;
}

/**
 * An abstract superclass for frontend contributions that add a view to the application shell.
 */
export abstract class AbstractViewContribution<T extends Widget> extends InjectableService {
  options: ViewContributionOptions;

  constructor(
    @IWidgetManager protected readonly widgetManager: IWidgetManager,
    @IApplicationShell protected readonly shell: IApplicationShell,
  ) {
    super();
  }

  get widget(): Promise<T> {
    return this.widgetManager.getOrCreateWidget<T>(this.options.widgetId);
  }

  tryGetWidget(): T | undefined {
    return this.widgetManager.tryGetWidget(this.options.widgetId);
  }

  async openView(args: Partial<OpenViewArguments> = {}): Promise<T> {
    const shell = this.shell;
    const widget = await this.widget;
    const tabBar = shell.getTabBarFor(widget);
    const area = shell.getAreaFor(widget);
    if (!tabBar) {
      // The widget is not attached yet, so add it to the shell
      const widgetArgs: OpenViewArguments = {
        ...this.options.defaultWidgetOptions,
        ...args,
      };
      shell.addWidget(widget, widgetArgs);
    }
    else if (args.toggle && area && shell.isExpanded(area) && tabBar.currentTitle === widget.title) {
      // The widget is attached and visible, so close it (toggle)
      widget.close();
    }
    if (widget.isAttached && args.activate) {
      shell.activateWidget(widget.id);
    }
    else if (widget.isAttached && args.reveal) {
      shell.revealWidget(widget.id);
    }
    return widget;
  }

  setupOptions(options: ViewContributionOptions) {
    this.options = options;
  }
}

// ===========================测试Widget===========================

export class SearchInWorkspaceWidget extends InjectableBaseWidget {
  static ID = "search-in-workspace";
  static LABEL = "Search";

  protected contentNode: HTMLElement;
  protected searchFormContainer: HTMLElement;

  @PostConstruct()
  init() {
    this.id = SearchInWorkspaceWidget.ID;
    this.title.label = SearchInWorkspaceWidget.LABEL;
    this.contentNode = document.createElement('div');
    this.contentNode.classList.add("t-siw-search-container");
    this.searchFormContainer = document.createElement('div');
    this.searchFormContainer.classList.add("searchHeader");
    this.contentNode.appendChild(this.searchFormContainer);
    this.node.appendChild(this.contentNode);
  }

  protected override onAfterAttach(msg: Message) {
    super.onAfterAttach(msg);
    VirtualRenderer.render(this.renderControlButtons(), this.searchFormContainer);
  }

  protected renderControlButtons(): h.Child {
    const refreshButton = this.renderControlButton(`refresh enabled}`, 'Refresh', this.refresh);

    return h.div({ className: "controls button-container" }, refreshButton);
  }

  protected renderControlButton(btnClass: string, title: string, clickHandler: () => void): h.Child {
    return h.span({ className: `btn ${btnClass}`, title, onclick: clickHandler });
  }

  protected refresh = () => {
    this.update();
  };
}

export const ISearchInWorkspaceWidget = createServiceDecorator<ISearchInWorkspaceWidget>(SearchInWorkspaceWidget.name);
export type ISearchInWorkspaceWidget = SearchInWorkspaceWidget;

@Contribution(IWidgetFactory)
export class SearchWidgetFactory extends InjectableService {
  public readonly id = "search-in-workspace";

  createWidget(container: IServiceContainer) {
    return container.get<ISearchInWorkspaceWidget>(ISearchInWorkspaceWidget);
  }
}

export const ISearchInWorkspaceFrontendContribution = createServiceDecorator<ISearchInWorkspaceFrontendContribution>("SearchInWorkspaceFrontendContribution");
export type ISearchInWorkspaceFrontendContribution = SearchInWorkspaceFrontendContribution;
export class SearchInWorkspaceFrontendContribution extends AbstractViewContribution<SearchInWorkspaceWidget> {
  async initializeLayout(): Promise<void> {
    this.setupOptions({
      widgetId: SearchInWorkspaceWidget.ID,
      widgetName: SearchInWorkspaceWidget.LABEL,
      defaultWidgetOptions: {
        area: "left",
      },
    });
    await this.openView({ activate: true });
  }
}

@Module({
  services: [
    WidgetManager,
    SearchInWorkspaceWidget,
    SearchWidgetFactory,
    SearchInWorkspaceFrontendContribution,
  ],
})
export class SearchModule extends ServiceModule {}
