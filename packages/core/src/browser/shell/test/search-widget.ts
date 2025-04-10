import { h } from "@lumino/virtualdom";
import {
  Contribution,
  IServiceContainer,
  InjectableService,
  Module,
  PostConstruct,
  ServiceModule,
  createServiceDecorator,
} from '../../../common';
import { BaseWidget, IWidgetFactory, Message, VirtualRenderer, WidgetManager, codicon } from "../../widgets";
import { AbstractViewContribution } from "../view-contribution";

// ===========================测试Widget===========================

export class SearchInWorkspaceWidget extends BaseWidget {
  static ID = "search-in-workspace";
  static LABEL = "Search";

  protected contentNode: HTMLElement;
  protected searchFormContainer: HTMLElement;

  @PostConstruct()
  init() {
    this.id = SearchInWorkspaceWidget.ID;
    this.title.label = SearchInWorkspaceWidget.LABEL;
    this.title.iconClass = codicon('search');

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

// 用来创建对应id的widget
@Contribution(IWidgetFactory)
export class SearchWidgetFactory extends InjectableService {
  public readonly id = SearchInWorkspaceWidget.ID;

  createWidget(container: IServiceContainer) {
    return container.get<ISearchInWorkspaceWidget>(ISearchInWorkspaceWidget);
  }
}

export const ISearchInWorkspaceFrontendContribution = createServiceDecorator<ISearchInWorkspaceFrontendContribution>("SearchInWorkspaceFrontendContribution");
export type ISearchInWorkspaceFrontendContribution = SearchInWorkspaceFrontendContribution;

// 连接到application shell
export class SearchInWorkspaceFrontendContribution extends AbstractViewContribution<SearchInWorkspaceWidget> {
  async initializeLayout(): Promise<void> {
    this.setupOptions({
      widgetId: SearchInWorkspaceWidget.ID,
      widgetName: SearchInWorkspaceWidget.LABEL,
      defaultWidgetOptions: {
        area: "left",
      },
    });
    await this.openView({ activate: true, reveal: true });
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
