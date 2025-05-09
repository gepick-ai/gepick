import { Title, Widget } from "@lumino/widgets";
import { Emitter, Event, IContributionProvider, InjectableService, Optional, createContribution, createServiceDecorator, lodashDebounce } from "@gepick/core/common";
import { WidgetDecoration } from "../widget";
import { IApplicationContribution } from "../application";
import { Decoration, IDecorationsService, Navigatable } from "../services";
import { IColorRegistry } from "../theme";

export const TabBarDecorator = Symbol('TabBarDecorator');

export interface TabBarDecorator {

  /**
   * The unique identifier of the tab bar decorator.
   */
  readonly id: string;

  /**
   * Event that is fired when any of the available tab bar decorators has changes.
   */
  readonly onDidChangeDecorations: Event<void>;

  /**
   * Decorate title.
   * @param {Title<Widget>} title the title
   * @returns decoration data.
   */
  decorate: (title: Title<Widget>) => WidgetDecoration.Data[];
}

const [ITabBarDecorator, ITabBarDecoratorProvider] = createContribution<ITabBarDecorator>("TabBarDecorator");
export type ITabBarDecorator = TabBarDecorator;

export class TabBarDecoratorService extends InjectableService implements IApplicationContribution {
  protected readonly onDidChangeDecorationsEmitter = new Emitter<void>();

  readonly onDidChangeDecorations = this.onDidChangeDecorationsEmitter.event;

  constructor(
        @Optional() @ITabBarDecoratorProvider protected readonly contributions: IContributionProvider<ITabBarDecorator>,
        @IDecorationsService protected readonly decorationsService: IDecorationsService,
        @IColorRegistry protected readonly colors: IColorRegistry,
  ) {
    super();
  }

  onApplicationInit(): void {
    this.contributions?.getContributions().map(decorator => decorator.onDidChangeDecorations(this.fireDidChangeDecorations));
  }

  fireDidChangeDecorations = lodashDebounce(() => this.onDidChangeDecorationsEmitter.fire(undefined), 150);

  /**
   * Assign tabs the decorators provided by all the contributions.
   * @param {Title<Widget>} title the title
   * @returns an array of its decoration data.
   */
  getDecorations(title: Title<Widget>): WidgetDecoration.Data[] {
    const decorators = this.contributions?.getContributions() ?? [];
    const decorations: WidgetDecoration.Data[] = [];
    for (const decorator of decorators) {
      decorations.push(...decorator.decorate(title));
    }
    if (Navigatable.is(title.owner)) {
      const resourceUri = title.owner.getResourceUri();
      if (resourceUri) {
        const serviceDecorations = this.decorationsService.getDecoration(resourceUri, false);
        decorations.push(...serviceDecorations.map(d => this.fromDecoration(d)));
      }
    }
    return decorations;
  }

  protected fromDecoration(decoration: Decoration): WidgetDecoration.Data {
    const colorVariable = decoration.colorId && this.colors.toCssVariableName(decoration.colorId);
    return {
      tailDecorations: [
        {
          data: decoration.letter ? decoration.letter : '',
          fontData: {
            color: colorVariable && `var(${colorVariable})`,
          },
          tooltip: decoration.tooltip ? decoration.tooltip : '',
        },
      ],
    };
  }
}
export const ITabBarDecoratorService = createServiceDecorator<ITabBarDecoratorService>(TabBarDecoratorService.name);
export type ITabBarDecoratorService = TabBarDecoratorService;
