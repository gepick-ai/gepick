import { InjectableService, createServiceDecorator } from "@gepick/core/common";

export class ThemeService extends InjectableService {
  static readonly STORAGE_KEY = 'theme';

  getCurrentTheme() {
    return {
      type: "dark",
    };
  }
}

export const IThemeService = createServiceDecorator<IThemeService>(ThemeService.name);
export type IThemeService = ThemeService;
