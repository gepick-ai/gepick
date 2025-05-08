import { Module, ServiceModule, createServiceDecorator } from "@gepick/core/common";
import { AbstractPreferencesSchemaPart } from "../preferences-schema-part-contribution";
import { AbstractPreferencesProxy } from "../preferences-proxy";

export class PluginPreferencesSchemaPart extends AbstractPreferencesSchemaPart {
  constructor() {
    super({
      type: 'object',
      properties: {
        'plugin.registry': {
          type: 'string',
          description: "set the plugin registry",
          default: "https://vsx.open.registry",
        },
      },
    });
  }
}
export const IPluginPreferencesSchemaPart = createServiceDecorator<IPluginPreferencesSchemaPart>(PluginPreferencesSchemaPart.name);
export type IPluginPreferencesSchemaPart = PluginPreferencesSchemaPart;

export class PluginPreferencesProxy extends AbstractPreferencesProxy<PluginPreferencesProxy.IProperties> {
  constructor(
    @IPluginPreferencesSchemaPart protected readonly pluginPreferencesSchemaPart: IPluginPreferencesSchemaPart,
  ) {
    super(pluginPreferencesSchemaPart);
  }

  // @OnActivation()
  // handleActivation(context: interfaces.Context, injectable: PluginPreferencesProxy) {
  //   // // eslint-disable-next-line no-console
  //   // console.log("🚀 ~ PluginPreferencesService ~ handleActivation ~ injectable:", injectable);
  //   // // eslint-disable-next-line no-console
  //   // console.log("🚀 ~ PluginPreferencesService ~ handleActivation ~ context:", context);

  //   return injectable;
  // }
}
export namespace PluginPreferencesProxy {
  export interface IProperties {
    'plugin.registry': string;
  }
}
export const IPluginPreferencesProxy = createServiceDecorator<IPluginPreferencesProxy>(PluginPreferencesProxy.name);
export type IPluginPreferencesProxy = PluginPreferencesProxy;

@Module({
  services: [
    PluginPreferencesSchemaPart,
    PluginPreferencesProxy,
  ],
})
export class PluginPreferencesModule extends ServiceModule {}
