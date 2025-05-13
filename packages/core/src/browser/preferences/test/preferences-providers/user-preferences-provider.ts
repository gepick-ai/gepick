// @ts-nocheck
import { AbstractPreferencesProvider } from "../../preferences-provider-contribution";

export class UserPreferencesProvider extends AbstractPreferencesProvider {
  override getPreferences(_resourceUri?: string): { [p: string]: any } {
    throw new Error("Method not implemented.");
  }

  override setPreference(_key: string, _value: any, _resourceUri?: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
