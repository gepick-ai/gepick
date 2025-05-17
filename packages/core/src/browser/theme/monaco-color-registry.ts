import { ColorDefaults, ColorValue, getColorRegistry } from '@theia/monaco-editor-core/esm/vs/platform/theme/common/colorRegistry';
import { StandaloneServices } from '@theia/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices';
import { IStandaloneThemeService } from '@theia/monaco-editor-core/esm/vs/editor/standalone/common/standaloneTheme';
import { HSLA, Color as MonacoColor, RGBA } from '@theia/monaco-editor-core/esm/vs/base/common/color';
import * as Colors from '@theia/monaco-editor-core/esm/vs/platform/theme/common/colorRegistry';
import { Color, ColorDefinition, IDisposable, toDisposable } from '@gepick/core/common';
import { ColorRegistry } from './color-registry';

export class MonacoColorRegistry extends ColorRegistry {
  static override name = ColorRegistry.name;

  protected readonly monacoThemeService = StandaloneServices.get(IStandaloneThemeService);
  protected readonly monacoColorRegistry = getColorRegistry();

  protected override doRegister(definition: ColorDefinition): IDisposable {
    const defaults: ColorDefaults = {
      dark: this.toColor(definition.defaults?.dark),
      light: this.toColor(definition.defaults?.light),
      hcDark: this.toColor(definition.defaults?.hcDark ?? definition.defaults?.hc),
      hcLight: this.toColor(definition.defaults?.hcLight),
    };

    const identifier = this.monacoColorRegistry.registerColor(definition.id, defaults, definition.description);
    return toDisposable(() => this.monacoColorRegistry.deregisterColor(identifier));
  }

  override *getColors(): IterableIterator<string> {
    for (const { id } of this.monacoColorRegistry.getColors()) {
      yield id;
    }
  }

  setDarkTheme() {
    this.monacoThemeService.setTheme("vs-dark");
  }

  setLightTheme() {
    this.monacoThemeService.setTheme("vs");
  }

  override getCurrentColor(id: string): string | undefined {
    return this.monacoThemeService.getColorTheme().getColor(id)?.toString();
  }

  getColor(id: string): MonacoColor | undefined {
    return this.monacoThemeService.getColorTheme().getColor(id);
  }

  protected toColor(value: Color | undefined): ColorValue | null {
    if (!value || typeof value === 'string') {
      return value ?? null;
    }
    if ('kind' in value) {
      return Colors[value.kind](value.v, value.f);
    }
    else if ('r' in value) {
      const { r, g, b, a } = value;
      return new MonacoColor(new RGBA(r, g, b, a));
    }
    else {
      const { h, s, l, a } = value;
      return new MonacoColor(new HSLA(h, s, l, a));
    }
  }
}
