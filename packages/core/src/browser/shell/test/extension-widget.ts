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
import { BaseWidget, IWidgetFactory, Message, VirtualRenderer, codicon } from "../../widgets";
import { AbstractViewContribution, IViewContribution } from "../view-contribution/view-contribution";

// ===========================测试Widget===========================

export class ExtensionWidget extends BaseWidget {
  static ID = "extensions";
  static LABEL = "Extensions";

  protected contentNode: HTMLElement;
  protected searchFormContainer: HTMLElement;

  @PostConstruct()
  init() {
    this.id = ExtensionWidget.ID;
    this.title.label = ExtensionWidget.LABEL;
    this.title.iconClass = codicon('extensions');

    this.contentNode = document.createElement('div');
    this.searchFormContainer = document.createElement('div');
    this.searchFormContainer.appendChild(document.createTextNode(ExtensionWidget.ID));
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

export const IExtensionWidget = createServiceDecorator<IExtensionWidget>(ExtensionWidget.name);
export type IExtensionWidget = ExtensionWidget;

// 用来创建对应id的widget
@Contribution(IWidgetFactory)
export class ExtensionWidgetFactory extends InjectableService {
  public readonly id = ExtensionWidget.ID;

  createWidget(container: IServiceContainer) {
    return container.get<IExtensionWidget>(IExtensionWidget);
  }
}

// 连接到application shell

@Contribution(IViewContribution)
export class ExtensionFrontendContribution extends AbstractViewContribution<ExtensionWidget> {
  async initializeLayout(): Promise<void> {
    this.setupOptions({
      widgetId: ExtensionWidget.ID,
      widgetName: ExtensionWidget.LABEL,
      defaultWidgetOptions: {
        area: "left",
      },
    });
    await this.setupView({ activate: false });
  }
}

export const IExtensionFrontendContribution = createServiceDecorator<IExtensionFrontendContribution>(ExtensionFrontendContribution.name);
export type IExtensionFrontendContribution = ExtensionFrontendContribution;

@Module({
  services: [
    ExtensionWidget,
    ExtensionWidgetFactory,
    ExtensionFrontendContribution,
  ],
})
export class ExtensionModule extends ServiceModule {}
