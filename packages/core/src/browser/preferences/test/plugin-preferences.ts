import { Module, OnActivation, ServiceModule, createServiceDecorator, interfaces } from "@gepick/core/common";
import { PreferencesSchemaContribution } from "../preferences-schema-contribution";
import { PreferencesService } from "../preferences-proxy";

export class PluginPreferencesSchema extends PreferencesSchemaContribution {
  type = 'object';
  properties = {
    'plugin.registry': {
      type: 'string',
      description: "set the plugin registry",
      default: "https://vsx.open.registry",
    },
    'plugin.proxy': {
      type: "string",
      description: "set the plugin proxy",
      default: 'http://localhost:7890',
    },
    'plugin.uri': {
      type: "string",
      description: "set the plugin uri",
      default: 'http://localhost:7890',
    },
    'plugin.name': {
      type: "string",
      description: "set the plugin name",
      default: 'http://localhost:7890',
    },
    'plugin.icon': {
      type: "string",
      description: "set the plugin icon",
      default: 'http://localhost:7890',
    },
    'plugin.foo': {
      type: "string",
      description: "set the plugin icon",
      default: 'http://localhost:7890',
    },
    'plugin.bar': {
      type: "string",
      description: "set the plugin icon",
      default: 'http://localhost:7890',
    },
    'plugin.boo': {
      type: "string",
      description: "set the plugin icon",
      default: 'http://localhost:7890',
    },
  };
}
export const IPluginPreferencesSchema = createServiceDecorator<IPluginPreferencesSchema>(PluginPreferencesSchema.name);
export type IPluginPreferencesSchema = PluginPreferencesSchema;

export namespace PluginPreferencesService {
  export interface IProperties {
    'plugin.registry': string;
    'plugin.proxy': string;
  }
}
export class PluginPreferencesService extends PreferencesService<PluginPreferencesService.IProperties> {
  constructor(
    @IPluginPreferencesSchema protected readonly pluginPreferencesSchema: IPluginPreferencesSchema,
  ) {
    super(pluginPreferencesSchema);
  }

  @OnActivation()
  handleActivation(context: interfaces.Context, injectable: PluginPreferencesService) {
    // // eslint-disable-next-line no-console
    // console.log("🚀 ~ PluginPreferencesService ~ handleActivation ~ injectable:", injectable);
    // // eslint-disable-next-line no-console
    // console.log("🚀 ~ PluginPreferencesService ~ handleActivation ~ context:", context);

    return injectable;
  }
}

export const IPluginPreferencesService = createServiceDecorator<IPluginPreferencesService>(PluginPreferencesService.name);
export type IPluginPreferencesService = PluginPreferencesService;

@Module({
  services: [
    PluginPreferencesSchema,
    PluginPreferencesService,
  ],
})
export class PluginPreferencesModule extends ServiceModule {}
