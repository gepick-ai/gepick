import { Module, ServiceModule, createServiceDecorator } from "@gepick/core/common";
import { AbstractPreferencesSchemaPart } from "../preferences-schema-part-contribution";
import { AbstractPreferencesProxy } from "../preferences-proxy";

export class ThemePreferencesSchemaPart extends AbstractPreferencesSchemaPart {
  constructor() {
    super({
      type: 'object',
      properties: {
        'theme.background': {
          type: 'string',
          description: 'set theme background',
          default: '#ffffff',
        },
        'theme.icon': {
          type: 'string',
          description: 'set theme icon',
          default: 'gepick-product-icon',
        },
      },
    });
  }
}
export const IThemePreferencesSchemaPart = createServiceDecorator<IThemePreferencesSchemaPart>(ThemePreferencesSchemaPart.name);
export type IThemePreferencesSchemaPart = ThemePreferencesSchemaPart;

export class ThemePreferencesProxy extends AbstractPreferencesProxy<ThemePreferencesProxy.IProperties> {
  constructor(
    @IThemePreferencesSchemaPart protected readonly themePreferencesSchemaPart: IThemePreferencesSchemaPart,
  ) {
    super(themePreferencesSchemaPart);
  }
}
export namespace ThemePreferencesProxy {
  export interface IProperties {
    'theme.background': string;
    'theme.icon': string;
  }
}
export const IThemePreferencesProxy = createServiceDecorator<IThemePreferencesProxy>(ThemePreferencesProxy.name);
export type IThemePreferencesProxy = ThemePreferencesProxy;

@Module({
  services: [
    ThemePreferencesSchemaPart,
    ThemePreferencesProxy,
  ],
})
export class ThemePreferencesModule extends ServiceModule {}
