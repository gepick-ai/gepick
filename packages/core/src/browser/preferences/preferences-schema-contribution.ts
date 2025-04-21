import { InjectableService, createContribution } from "@gepick/core/common";

export const [IPreferencesSchema, IPreferencesSchemaProvider] = createContribution<IPreferencesSchema>("PreferencesSchema");
export interface IPreferencesSchema {
  [name: string]: any;
  properties: any;
}

export abstract class PreferencesSchema extends InjectableService implements IPreferencesSchema {
  abstract type: string;
  abstract properties: any;

  [name: string]: any;
}
