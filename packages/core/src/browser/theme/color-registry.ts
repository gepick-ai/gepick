import { ColorCssVariable, ColorDefinition, DisposableCollection, Emitter, IDisposable, InjectableService, createServiceDecorator, toDisposable } from "@gepick/core/common";

export class ColorRegistry extends InjectableService {
  protected readonly _onDidChange = new Emitter<void>();
  readonly onDidChange = this._onDidChange.event;

  register(...definitions: ColorDefinition[]): IDisposable {
    const result = new DisposableCollection();
    result.pushAll(definitions.map(definition => this.doRegister(definition)));
    this._onDidChange.fire(undefined);
    return result;
  }

  protected doRegister(_definition: ColorDefinition): IDisposable {
    return toDisposable(() => {});
  }

  *getColors(): IterableIterator<string> {}

  getCurrentCssVariable(id: string): ColorCssVariable | undefined {
    const value = this.getCurrentColor(id);
    if (!value) {
      return undefined;
    }
    const name = this.toCssVariableName(id);
    return { name, value };
  }

  getCurrentColor(_id: string): string | undefined {
    return undefined;
  }

  toCssVariableName(id: string, prefix = 'theia'): string {
    return `--${prefix}-${id.replace(/\./g, '-')}`;
  }
}
export const IColorRegistry = createServiceDecorator<IColorRegistry>(ColorRegistry.name);
export type IColorRegistry = ColorRegistry & { setDarkTheme: () => void };
