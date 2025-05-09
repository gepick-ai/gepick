import { Widget } from '@lumino/widgets';
import stableJsonStringify from 'fast-json-stable-stringify';
import { Emitter, Event, IContributionProvider, IServiceContainer, InjectableService, WaitUntilEvent, createServiceDecorator } from '@gepick/core/common';
import { IWidgetFactory, IWidgetFactoryProvider } from './widget-factory-contribution';

export type MaybePromise<T> = T | Promise<T>;

/*
 * a serializable description to create a widget
 */
export interface WidgetConstructionOptions {
  /**
   * the id of the widget factory to use.
   */
  factoryId: string;

  /*
     * widget factory specific information
     */
  options?: any;
}

export interface DidCreateWidgetEvent {
  readonly widget: Widget;
  readonly factoryId: string;
}

/**
 * Representation of a `willCreateWidgetEvent`.
 */
export interface WillCreateWidgetEvent extends WaitUntilEvent {
  /**
   * The widget which will be created.
   */
  readonly widget: Widget;
  /**
   * The widget factory id.
   */
  readonly factoryId: string;
}

// #region WidgetManager
export const IWidgetManager = createServiceDecorator<IWidgetManager>("WidgetManager");
export type IWidgetManager = WidgetManager;

/**
 * Creates and manages widgets.
 */
export class WidgetManager extends InjectableService {
  protected _cachedFactories: Map<string, IWidgetFactory>;
  protected readonly widgets = new Map<string, Widget>();
  protected readonly pendingWidgetPromises = new Map<string, Promise<Widget>>();

  protected readonly onWillCreateWidgetEmitter = new Emitter<WillCreateWidgetEvent>();
  /**
   * An event can be used to participate in the widget creation.
   * Listeners may not dispose the given widget.
   */
  readonly onWillCreateWidget: Event<WillCreateWidgetEvent> = this.onWillCreateWidgetEmitter.event;

  protected readonly onDidCreateWidgetEmitter = new Emitter<DidCreateWidgetEvent>();
  readonly onDidCreateWidget: Event<DidCreateWidgetEvent> = this.onDidCreateWidgetEmitter.event;

  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
    @IWidgetFactoryProvider protected readonly factoryProvider: IContributionProvider<IWidgetFactory>,
  ) {
    super();
  }

  /**
   * Get the list of widgets created by the given widget factory.
   * @param factoryId the widget factory id.
   *
   * @returns the list of widgets created by the factory with the given id.
   */
  getWidgets(factoryId: string): Widget[] {
    const result: Widget[] = [];
    for (const [key, widget] of this.widgets.entries()) {
      if (this.fromKey(key).factoryId === factoryId) {
        result.push(widget);
      }
    }
    return result;
  }

  /**
   * Try to get the existing widget for the given description.
   * @param factoryId The widget factory id.
   * @param options The widget factory specific information.
   *
   * @returns the widget if available, else `undefined`.
   *
   * The widget is 'available' if it has been created with the same {@link factoryId} and {@link options} by the {@link WidgetManager}.
   * If the widget's creation is asynchronous, it is only available when the associated `Promise` is resolved.
   */
  tryGetWidget<T extends Widget>(factoryId: string, options?: any): T | undefined {
    const key = this.toKey({ factoryId, options });
    const existing = this.widgets.get(key);
    if (existing instanceof Widget) {
      return existing as T;
    }
    return undefined;
  }

  /**
   * Try to get the existing widget for the given description.
   * @param factoryId The widget factory id.
   * @param options The widget factory specific information.
   *
   * @returns A promise that resolves to the widget, if any exists. The promise may be pending, so be cautious when assuming that it will not reject.
   */
  tryGetPendingWidget<T extends Widget>(factoryId: string, options?: any): MaybePromise<T> | undefined {
    const key = this.toKey({ factoryId, options });
    return this.doGetWidget(key);
  }

  /**
   * Get the widget for the given description.
   * @param factoryId The widget factory id.
   * @param options The widget factory specific information.
   *
   * @returns a promise resolving to the widget if available, else `undefined`.
   */
  async getWidget<T extends Widget>(factoryId: string, options?: any): Promise<T | undefined> {
    const key = this.toKey({ factoryId, options });
    const pendingWidget = this.doGetWidget<T>(key);
    const widget = pendingWidget && await pendingWidget;
    return widget;
  }

  /**
   * Finds a widget that matches the given test predicate.
   * @param factoryId The widget factory id.
   * @param predicate The test predicate.
   *
   * @returns a promise resolving to the widget if available, else `undefined`.
   */
  async findWidget<T extends Widget>(factoryId: string, predicate: (options?: any) => boolean): Promise<T | undefined> {
    for (const [key, widget] of this.widgets.entries()) {
      if (this.testPredicate(key, factoryId, predicate)) {
        return widget as T;
      }
    }
    for (const [key, widgetPromise] of this.pendingWidgetPromises.entries()) {
      if (this.testPredicate(key, factoryId, predicate)) {
        return widgetPromise as Promise<T>;
      }
    }

    return Promise.resolve(void 0);
  }

  protected testPredicate(key: string, factoryId: string, predicate: (options?: any) => boolean): boolean {
    const constructionOptions = this.fromKey(key);
    return constructionOptions.factoryId === factoryId && predicate(constructionOptions.options);
  }

  protected doGetWidget<T extends Widget>(key: string): MaybePromise<T> | undefined {
    const pendingWidget = this.widgets.get(key) ?? this.pendingWidgetPromises.get(key);
    if (pendingWidget) {
      return pendingWidget as MaybePromise<T>;
    }
    return undefined;
  }

  /**
   * Creates a new widget or returns the existing widget for the given description.
   * @param factoryId the widget factory id.
   * @param options the widget factory specific information.
   *
   * @returns a promise resolving to the widget.
   */
  async getOrCreateWidget<T extends Widget>(factoryId: string, options?: any): Promise<T> {
    const key = this.toKey({ factoryId, options });
    const existingWidget = this.doGetWidget<T>(key);
    if (existingWidget) {
      return existingWidget;
    }
    const factory = this.factories.get(factoryId);
    if (!factory) {
      throw new Error(`No widget factory '${factoryId}' has been registered.`);
    }
    const widgetPromise = this.doCreateWidget<T>(factory, options).then((widget) => {
      this.widgets.set(key, widget);
      widget.disposed.connect(() => this.widgets.delete(key));
      this.onDidCreateWidgetEmitter.fire({ factoryId, widget });
      return widget;
    }).finally(() => this.pendingWidgetPromises.delete(key));
    this.pendingWidgetPromises.set(key, widgetPromise);
    return widgetPromise;
  }

  protected async doCreateWidget<T extends Widget>(factory: IWidgetFactory, options?: any): Promise<T> {
    const widget = await factory.createWidget(this.serviceContainer, options);
    // Note: the widget creation process also includes the 'onWillCreateWidget' part, which can potentially fail
    try {
      await WaitUntilEvent.fire(this.onWillCreateWidgetEmitter, { factoryId: factory.id, widget });
    }
    catch (e) {
      widget.dispose();
      throw e;
    }
    return widget as T;
  }

  /**
   * Get the widget construction options.
   * @param widget the widget.
   *
   * @returns the widget construction options if the widget was created through the manager, else `undefined`.
   */
  getDescription(widget: Widget): WidgetConstructionOptions | undefined {
    for (const [key, aWidget] of this.widgets.entries()) {
      if (aWidget === widget) {
        return this.fromKey(key);
      }
    }
    return undefined;
  }

  /**
   * Convert the widget construction options to string.
   * @param options the widget construction options.
   *
   * @returns the widget construction options represented as a string.
   */
  protected toKey(options: WidgetConstructionOptions): string {
    return stableJsonStringify(options);
  }

  /**
   * Convert the key into the widget construction options object.
   * @param key the key.
   *
   * @returns the widget construction options object.
   */
  protected fromKey(key: string): WidgetConstructionOptions {
    return JSON.parse(key);
  }

  protected get factories(): Map<string, IWidgetFactory> {
    if (!this._cachedFactories) {
      this._cachedFactories = new Map();
      for (const factory of this.factoryProvider.getContributions()) {
        if (factory.id) {
          this._cachedFactories.set(factory.id, factory);
        }
        else {
          console.error(`Invalid ID for factory: ${factory}. ID was: '${factory.id}'.`);
        }
      }
    }
    return this._cachedFactories;
  }
}
// #endregion
