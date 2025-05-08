import { PluginPreferencesSchemaPart } from "./plugin-preferences-schema-part";

import { CorePreferencesProxy, CorePreferencesSchemaPart } from "./core-preferences-schema-part";

export * from "./core-preferences-schema-part";

export const samplePreferences = [
  PluginPreferencesSchemaPart,
  CorePreferencesSchemaPart,
  CorePreferencesProxy,
];
