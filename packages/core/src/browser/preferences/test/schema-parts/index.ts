import { PluginPreferencesSchemaPart } from "./plugin-preferences-schema-part";

import { CorePreferences, CorePreferencesSchemaPart } from "./core-preferences-schema-part";

export * from "./core-preferences-schema-part";

export const preferencesSchemaParts = [
  PluginPreferencesSchemaPart,
  CorePreferencesSchemaPart,
  CorePreferences,
];
