import { PreferenceScope } from "@gepick/core/common";
import { PreferenceProviderContribution } from "../../preference-provider-contribution";

export class UserPreferencesProvider extends PreferenceProviderContribution {
  override getScope(): PreferenceScope {
    return PreferenceScope.User;
  }

  override getPreferences(_resourceUri?: string): { [p: string]: any } {
    throw new Error("Method not implemented.");
  }

  override setPreference(_key: string, _value: any, _resourceUri?: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
