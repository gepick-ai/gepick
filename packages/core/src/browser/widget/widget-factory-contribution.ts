import { Widget } from '@lumino/widgets';
import { Contribution, IServiceContainer, InjectableService, MaybePromise, createContribution } from '@gepick/core/common';

// #region WidgetFactory
export const [IWidgetFactory, IWidgetFactoryProvider] = createContribution<IWidgetFactory>('WidgetFactory');
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
/**
 * 一个自定义的Widget Factory必须继承并实现AbstractWidgetFactory的相关属性。
 */
@Contribution(IWidgetFactory)
export abstract class AbstractWidgetFactory extends InjectableService implements IWidgetFactory {
  id: string;
  abstract createWidget(container: IServiceContainer, options?: any): MaybePromise<Widget>;
}
// #endregion
