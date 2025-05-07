import { Contribution, IContributionProvider, InjectableService, Unmanaged, createContribution } from "@gepick/core/common";

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
