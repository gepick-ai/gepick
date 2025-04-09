/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { Emitter, Event, IContributionProvider, IServiceContainer, InjectableService, createContribution, createServiceDecorator } from '@gepick/core/common';

export type MaybePromise<T> = T | Promise<T>;
// tslint:disable:no-any
export const WidgetFactory = Symbol("WidgetFactory");
/**
 * `OpenHandler` should be implemented to provide a new opener.
 */
export interface IWidgetFactory {

  /*
     * the factory's id
     */
  readonly id: string;

  /**
   * Creates a widget and attaches it to the shell
   * The options need to be serializable JSON data.
   */
  createWidget: (serviceContainer: IServiceContainer, options?: any) => MaybePromise<Widget>;
}

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

export const [IWidgetFactory, IWidgetFactoryProvider] = createContribution<IWidgetFactory>('WidgetFactory');
export const IWidgetManager = createServiceDecorator<IWidgetManager>("WidgetManager");
export type IWidgetManager = WidgetManager;

/**
 * Creates and manages widgets.
 */
export class WidgetManager extends InjectableService {
  protected _cachedFactories: Map<string, IWidgetFactory>;
  protected readonly widgets = new Map<string, Widget>();
  protected readonly widgetPromises = new Map<string, MaybePromise<Widget>>();

  protected readonly onDidCreateWidgetEmitter = new Emitter<DidCreateWidgetEvent>();
  readonly onDidCreateWidget: Event<DidCreateWidgetEvent> = this.onDidCreateWidgetEmitter.event;

  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
    @IWidgetFactoryProvider protected readonly factoryProvider: IContributionProvider<IWidgetFactory>,
  ) {
    super();
  }

  getWidgets(factoryId: string): Widget[] {
    const result: Widget[] = [];
    for (const [key, widget] of this.widgets.entries()) {
      if (this.fromKey(key).factoryId === factoryId) {
        result.push(widget);
      }
    }
    return result;
  }

  tryGetWidget<T extends Widget>(factoryId: string, options?: any): T | undefined {
    const key = this.toKey({ factoryId, options });
    const existing = this.widgetPromises.get(key);
    if (existing instanceof Widget) {
      return existing as T;
    }
    return undefined;
  }

  /**
   * return the widget for the given description
   */
  getWidget<T extends Widget>(factoryId: string, options?: any): Promise<T | undefined> {
    const key = this.toKey({ factoryId, options });
    return this.doGetWidget<T>(key);
  }

  protected async doGetWidget<T extends Widget>(key: string): Promise<T | undefined> {
    const existingWidgetPromise = this.widgetPromises.get(key);
    if (existingWidgetPromise) {
      const existingWidget = await existingWidgetPromise;
      return existingWidget as T;
    }
    return undefined;
  }

  /*
     * creates or returns the widget for the given description.
     */
  async getOrCreateWidget<T extends Widget>(factoryId: string, options?: any): Promise<T> {
    const key = this.toKey({ factoryId, options });
    const existingWidget = await this.doGetWidget<T>(key);
    if (existingWidget) {
      return existingWidget;
    }
    const factory = this.factories.get(factoryId);
    if (!factory) {
      throw new Error(`No widget factory '${factoryId}' has been registered.`);
    }
    const widgetPromise = factory.createWidget(this.serviceContainer, options);
    this.widgetPromises.set(key, widgetPromise);
    const widget = await widgetPromise;
    this.widgets.set(key, widget);
    widget.disposed.connect(() => {
      this.widgets.delete(key);
      this.widgetPromises.delete(key);
    });
    this.onDidCreateWidgetEmitter.fire({
      factoryId,
      widget,
    });
    return widget as T;
  }

  /*
     *  returns the construction description for the given widget, or undefined if the widget was not created through this manager.
     */
  getDescription(widget: Widget): WidgetConstructionOptions | undefined {
    for (const [key, aWidget] of this.widgets.entries()) {
      if (aWidget === widget) {
        return this.fromKey(key);
      }
    }
    return undefined;
  }

  protected toKey(options: WidgetConstructionOptions) {
    return JSON.stringify(options);
  }

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
          console.error(`Factory id cannot be undefined : ${factory}`);
        }
      }
    }
    return this._cachedFactories;
  }
}
