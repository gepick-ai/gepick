import { InjectableService, createServiceDecorator } from "./dependency-injection";
import { Emitter, Event } from "./event";
/**
 * `SelectionProvider` is implemented by services to notify listeners about selection changes.
 */
export interface SelectionProvider<T> {
  onSelectionChanged: Event<T | undefined>;
}

/**
 * Singleton service that is used to share the current selection globally in a Theia application.
 * On each change of selection, subscribers are notified and receive the updated selection object.
 */
export class SelectionService extends InjectableService implements SelectionProvider<object | undefined> {
  private currentSelection: object | undefined;

  protected readonly onSelectionChangedEmitter = new Emitter<any>();
  readonly onSelectionChanged: Event<any> = this.onSelectionChangedEmitter.event;

  get selection(): object | undefined {
    return this.currentSelection;
  }

  set selection(selection: object | undefined) {
    this.currentSelection = selection;
    this.onSelectionChangedEmitter.fire(this.currentSelection);
  }
}
export const ISelectionService = createServiceDecorator<ISelectionService>(SelectionService.name);
export type ISelectionService = SelectionService;
