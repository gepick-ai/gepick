import { Contribution, IContributionProvider, InjectableService, Unmanaged, createContribution, isObject } from "@gepick/core/common";
import { FrontendApplicationConfig } from "../application/application-props";

/**
 * Specialized {@link FrontendApplicationConfig} to configure default
 * preference values for the {@link PreferenceSchemaProvider}.
 */
export interface FrontendApplicationPreferenceConfig extends FrontendApplicationConfig {
  preferences: {
    [preferenceName: string]: any;
  };
}
export namespace FrontendApplicationPreferenceConfig {
  export function is(config: FrontendApplicationConfig): config is FrontendApplicationPreferenceConfig {
    return isObject(config.preferences);
  }
}

export interface IPreferencesSchema { type: string; properties: any;[name: string]: any }

export const [IPreferencesSchemaPart, IPreferencesSchemaPartProvider] = createContribution<IPreferencesSchemaPart>("PreferencesSchema");
export interface IPreferencesSchemaPart {
  getPreferencesSchema: () => IPreferencesSchema;
}
export interface IPreferencesSchemaPartProvider extends IContributionProvider<IPreferencesSchemaPart> {}

@Contribution(IPreferencesSchemaPart)
export abstract class AbstractPreferencesSchemaPart extends InjectableService implements IPreferencesSchemaPart {
  constructor(@Unmanaged() private readonly schema: IPreferencesSchema) {
    super();
  }

  getPreferencesSchema() {
    return this.schema;
  }
}
