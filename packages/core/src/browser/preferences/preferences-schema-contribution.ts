import { Contribution, InjectableService, createContribution } from "@gepick/core/common";

export const [IPreferencesSchema, IPreferencesSchemaProvider] = createContribution<IPreferencesSchema>("PreferencesSchema");
export interface IPreferencesSchema {
  [name: string]: any;
  properties: any;
}

@Contribution(IPreferencesSchema)
export abstract class PreferencesSchemaContribution extends InjectableService implements IPreferencesSchema {
  abstract type: string;
  abstract properties: any;

  [name: string]: any;
}
