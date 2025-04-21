import { Contribution, Module, ServiceModule, createServiceDecorator } from "@gepick/core/common";
import { IPreferencesSchema, PreferencesSchema } from "../preferences-schema-contribution";
import { PreferencesService } from "../preferences-proxy";

@Contribution(IPreferencesSchema)
export class ThemePreferencesSchema extends PreferencesSchema {
  type = 'object';
  properties = {
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
  };
}
export const IThemePreferencesSchema = createServiceDecorator<IThemePreferencesSchema>(ThemePreferencesSchema.name);
export type IThemePreferencesSchema = ThemePreferencesSchema;

export namespace ThemePreferencesService {
  export interface IProperties {
    'theme.background': string;
    'theme.icon': string;
  }
}
export class ThemePreferencesService extends PreferencesService<ThemePreferencesService.IProperties> {
  constructor(
    @IThemePreferencesSchema protected readonly themePreferencesSchema: IThemePreferencesSchema,
  ) {
    super(themePreferencesSchema);
  }
}

export const IThemePreferencesService = createServiceDecorator<IThemePreferencesService>(ThemePreferencesService.name);
export type IThemePreferencesService = ThemePreferencesService;

@Module({
  services: [
    ThemePreferencesSchema,
    ThemePreferencesService,
  ],
})
export class ThemePreferencesModule extends ServiceModule {}
