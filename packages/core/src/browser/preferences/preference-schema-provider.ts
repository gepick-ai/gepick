import { Ajv, Emitter, Event, IDisposable, Mutable, Optional, PostConstruct, PreferenceDataProperty, PreferenceDataSchema, PreferenceItem, PreferenceSchema, PreferenceSchemaProperties, PreferenceScope, createServiceDecorator, toDisposable } from "@gepick/core/common";
import { JSONValue } from "@lumino/coreutils";
import { FrontendApplicationConfigProvider } from "../application";
import { PreferenceProvider, PreferenceProviderDataChange } from "./preference-provider-contribution";
import { FrontendApplicationPreferenceConfig, IPreferencesSchemaPartProvider } from "./preference-schema-part-contribution";
import { IPreferenceConfigurations } from "./preference-configurations";

export const DefaultOverridesPreferenceSchemaId = 'defaultOverrides';

export class PreferenceSchemaProvider extends PreferenceProvider {
  protected readonly preferences: { [name: string]: any } = {};
  protected readonly combinedSchema: PreferenceDataSchema = { properties: {}, patternProperties: {}, allowComments: true, allowTrailingCommas: true };
  protected readonly workspaceSchema: PreferenceDataSchema = { properties: {}, patternProperties: {}, allowComments: true, allowTrailingCommas: true };
  protected readonly folderSchema: PreferenceDataSchema = { properties: {}, patternProperties: {}, allowComments: true, allowTrailingCommas: true };

  protected readonly onDidPreferenceSchemaChangedEmitter = new Emitter<void>();
  readonly onDidPreferenceSchemaChanged: Event<void> = this.onDidPreferenceSchemaChangedEmitter.event;
  protected fireDidPreferenceSchemaChanged(): void {
    this.onDidPreferenceSchemaChangedEmitter.fire(undefined);
  }

  @IPreferenceConfigurations protected readonly configurations: IPreferenceConfigurations;
  @Optional() @IPreferencesSchemaPartProvider protected readonly preferencesSchemaPartProvider: IPreferencesSchemaPartProvider;

  @PostConstruct()
  protected init(): void {
    // 1. 首先读取配置的默认值
    this.readConfiguredPreferences();
    // 2.收集各功能模块提供的preferences schema
    this.preferencesSchemaPartProvider.getContributions().forEach((schemaPart) => {
      this.doSetSchema(schemaPart.getPreferencesSchema());
    });
    this.combinedSchema.additionalProperties = false;
    this._ready.resolve();
  }

  protected readConfiguredPreferences(): void {
    const config = FrontendApplicationConfigProvider.get();
    if (FrontendApplicationPreferenceConfig.is(config)) {
      try {
        const configuredDefaults = config.preferences;
        const parsedDefaults = this.getParsedContent(configuredDefaults);
        Object.assign(this.preferences, parsedDefaults);
        const scope = PreferenceScope.Default;
        const domain = this.getDomain();
        const changes: PreferenceProviderDataChange[] = Object.keys(this.preferences)
          .map((key): PreferenceProviderDataChange => ({ preferenceName: key, oldValue: undefined, newValue: this.preferences[key], scope, domain }));
        this.emitPreferencesChangedEvent(changes);
      }
      catch (e) {
        console.error('Failed to load preferences from frontend configuration.', e);
      }
    }
  }

  /**
     * Register a new overrideIdentifier. Existing identifiers are not replaced.
     *
     * Allows overriding existing values while keeping both values in store.
     * For example to store different editor settings, e.g. "[markdown].editor.autoIndent",
     * "[json].editor.autoIndent" and "editor.autoIndent"
     * @param overrideIdentifier the new overrideIdentifier
     */
  registerOverrideIdentifier(overrideIdentifier: string): void {
    if (this.preferenceOverrideService.addOverrideIdentifier(overrideIdentifier)) {
      this.updateOverridePatternPropertiesKey();
    }
  }

  protected readonly overridePatternProperties: Required<Pick<PreferenceDataProperty, 'properties' | 'additionalProperties'>> & PreferenceDataProperty = {
    type: 'object',
    description: 'Configure editor settings to be overridden for a language.',
    errorMessage: 'Unknown Identifier. Use language identifiers',
    properties: {},
    additionalProperties: false,
  };

  protected overridePatternPropertiesKey: string | undefined;
  protected updateOverridePatternPropertiesKey(): void {
    const oldKey = this.overridePatternPropertiesKey;
    const newKey = this.preferenceOverrideService.computeOverridePatternPropertiesKey();
    if (oldKey === newKey) {
      return;
    }
    if (oldKey) {
      delete this.combinedSchema.patternProperties[oldKey];
    }
    this.overridePatternPropertiesKey = newKey;
    if (newKey) {
      this.combinedSchema.patternProperties[newKey] = this.overridePatternProperties;
    }
    this.fireDidPreferenceSchemaChanged();
  }

  protected doUnsetSchema(changes: PreferenceProviderDataChange[]): PreferenceProviderDataChange[] {
    const inverseChanges: PreferenceProviderDataChange[] = [];
    for (const change of changes) {
      const preferenceName = change.preferenceName;
      const overridden = this.preferenceOverrideService.overriddenPreferenceName(preferenceName);
      if (overridden) {
        delete this.overridePatternProperties.properties[`[${overridden.overrideIdentifier}]`];
        this.removePropFromSchemas(`[${overridden.overrideIdentifier}]`);
      }
      else {
        this.removePropFromSchemas(preferenceName);
      }
      const newValue = change.oldValue;
      const oldValue = change.newValue;
      const { scope, domain } = change;
      const inverseChange: Mutable<PreferenceProviderDataChange> = { preferenceName, oldValue, scope, domain };
      if (typeof newValue === "undefined") {
        delete this.preferences[preferenceName];
      }
      else {
        inverseChange.newValue = newValue;
        this.preferences[preferenceName] = newValue;
      }
      inverseChanges.push(inverseChange);
    }
    return inverseChanges;
  }

  protected validateSchema(schema: PreferenceSchema): void {
    const ajv = new Ajv();
    const valid = ajv.validateSchema(schema);
    if (!valid) {
      const errors = ajv.errors ? ajv.errorsText(ajv.errors) : 'unknown validation error';
      console.warn(`A contributed preference schema has validation issues : ${errors}`);
    }
  }

  protected doSetSchema(schema: PreferenceSchema): PreferenceProviderDataChange[] {
    if (FrontendApplicationConfigProvider.get().validatePreferencesSchema) {
      this.validateSchema(schema);
    }
    const scope = PreferenceScope.Default;
    const domain = this.getDomain();
    const changes: PreferenceProviderDataChange[] = [];
    const defaultScope = PreferenceSchema.getDefaultScope(schema);
    const overridable = schema.overridable || false;
    // 拿到功能模块提供的schema中的properties的key和value
    for (const [preferenceName, rawSchemaProps] of Object.entries(schema.properties)) {
      if (this.combinedSchema.properties[preferenceName] && DefaultOverridesPreferenceSchemaId !== schema.id) {
        console.error(`Preference name collision detected in the schema for property: ${preferenceName}`);
      }
      else {
        let schemaProps;
        if (this.combinedSchema.properties[preferenceName] && DefaultOverridesPreferenceSchemaId === schema.id) {
          // update existing default value in schema
          // 更新schema中存在的默认值
          schemaProps = PreferenceDataProperty.fromPreferenceSchemaProperty(rawSchemaProps, defaultScope);
          this.updateSchemaPropsDefault(preferenceName, schemaProps);
        }
        else if (!rawSchemaProps.hasOwnProperty('included') || rawSchemaProps.included) {
          // add overrides for languages
          schemaProps = PreferenceDataProperty.fromPreferenceSchemaProperty(rawSchemaProps, defaultScope);
          if (typeof schemaProps.overridable !== 'boolean' && overridable) {
            schemaProps.overridable = true;
          }
          if (schemaProps.overridable) {
            this.overridePatternProperties.properties[preferenceName] = schemaProps;
          }
          this.updateSchemaProps(preferenceName, schemaProps);
        }

        if (schemaProps !== undefined) {
          const schemaDefault = this.getDefaultValue(schemaProps);
          const configuredDefault = this.getConfiguredDefault(preferenceName);
          if (this.preferenceOverrideService.testOverrideValue(preferenceName, schemaDefault)) {
            schemaProps.defaultValue = PreferenceSchemaProperties.is(configuredDefault)
              ? PreferenceProvider.merge(schemaDefault, configuredDefault)
              : schemaDefault;
            if (schemaProps.defaultValue && PreferenceSchemaProperties.is(schemaProps.defaultValue)) {
              for (const overriddenPreferenceName in schemaProps.defaultValue) {
                const overrideValue = schemaDefault[overriddenPreferenceName];
                const overridePreferenceName = `${preferenceName}.${overriddenPreferenceName}`;
                changes.push(this.doSetPreferenceValue(overridePreferenceName, overrideValue, { scope, domain }));
              }
            }
          }
          else {
            schemaProps.defaultValue = configuredDefault === undefined ? schemaDefault : configuredDefault;
            changes.push(this.doSetPreferenceValue(preferenceName, schemaProps.defaultValue, { scope, domain }));
          }
        }
      }
    }
    return changes;
  }

  protected doSetPreferenceValue(preferenceName: string, newValue: any, { scope, domain }: {
    scope: PreferenceScope;
    domain?: string[];
  }): PreferenceProviderDataChange {
    const oldValue = this.preferences[preferenceName];
    this.preferences[preferenceName] = newValue;
    return { preferenceName, oldValue, newValue, scope, domain };
  }

  getDefaultValue(property: PreferenceItem): JSONValue {
    if (property.defaultValue !== undefined) {
      return property.defaultValue;
    }
    if (property.default !== undefined) {
      return property.default;
    }
    const type = Array.isArray(property.type) ? property.type[0] : property.type;
    switch (type) {
      case 'boolean':
        return false;
      case 'integer':
      case 'number':
        return 0;
      case 'string':
        return '';
      case 'array':
        return [];
      case 'object':
        return {};
    }
    return null;
  }

  protected getConfiguredDefault(preferenceName: string): any {
    const config = FrontendApplicationConfigProvider.get();
    if (preferenceName && FrontendApplicationPreferenceConfig.is(config) && preferenceName in config.preferences) {
      return config.preferences[preferenceName];
    }
  }

  getCombinedSchema(): PreferenceDataSchema {
    return this.combinedSchema;
  }

  getSchema(scope: PreferenceScope): PreferenceDataSchema {
    switch (scope) {
      case PreferenceScope.Default:
      case PreferenceScope.User:
        return this.combinedSchema;
      case PreferenceScope.Workspace:
        return this.workspaceSchema;
      case PreferenceScope.Folder:
        return this.folderSchema;
    }
  }

  setSchema(schema: PreferenceSchema): IDisposable {
    const changes = this.doSetSchema(schema);
    if (!changes.length) {
      return toDisposable(() => {});
    }
    this.fireDidPreferenceSchemaChanged();
    this.emitPreferencesChangedEvent(changes);
    return toDisposable(() => {
      const inverseChanges = this.doUnsetSchema(changes);
      if (!inverseChanges.length) {
        return;
      }
      this.fireDidPreferenceSchemaChanged();
      this.emitPreferencesChangedEvent(inverseChanges);
    });
  }

  getPreferences(): { [name: string]: any } {
    return this.preferences;
  }

  async setPreference(): Promise<boolean> {
    return false;
  }

  isValidInScope(preferenceName: string, scope: PreferenceScope): boolean {
    let property;
    const overridden = this.preferenceOverrideService.overriddenPreferenceName(preferenceName);
    if (overridden) {
      // try from overridden schema
      property = this.overridePatternProperties[`[${overridden.overrideIdentifier}]`];
      property = property && property[overridden.preferenceName];
      if (!property) {
        // try from overridden identifier
        property = this.overridePatternProperties[overridden.preferenceName];
      }
      if (!property) {
        // try from overridden value
        property = this.combinedSchema.properties[overridden.preferenceName];
      }
    }
    else {
      property = this.combinedSchema.properties[preferenceName];
    }
    return property && property.scope! >= scope;
  }

  *getPreferenceNames(): IterableIterator<string> {
    for (const preferenceName in this.combinedSchema.properties) {
      yield preferenceName;
      for (const overridePreferenceName of this.getOverridePreferenceNames(preferenceName)) {
        yield overridePreferenceName;
      }
    }
  }

  getOverridePreferenceNames(preferenceName: string): IterableIterator<string> {
    const preference = this.combinedSchema.properties[preferenceName];
    if (preference && preference.overridable) {
      return this.preferenceOverrideService.getOverridePreferenceNames(preferenceName);
    }
    return [][Symbol.iterator]();
  }

  getSchemaProperty(key: string): PreferenceDataProperty | undefined {
    return this.combinedSchema.properties[key];
  }

  /**
     * {@link property} will be assigned to field {@link key} in the schema.
     * Pass a new object to invalidate old schema.
     */
  updateSchemaProperty(key: string, property: PreferenceDataProperty): void {
    this.updateSchemaProps(key, property);
    this.fireDidPreferenceSchemaChanged();
  }

  protected updateSchemaProps(key: string, property: PreferenceDataProperty): void {
    this.combinedSchema.properties[key] = property;
  }

  protected updateSchemaPropsDefault(key: string, property: PreferenceDataProperty): void {
    // 将对应schema prop的默认值更改为传入进来的prop的default
    this.combinedSchema.properties[key].default = property.default;
    this.combinedSchema.properties[key].defaultValue = property.defaultValue;

    // 如果workspace schema对应key的prop存在
    if (this.workspaceSchema.properties[key]) {
      this.workspaceSchema.properties[key].default = property.default;
      this.workspaceSchema.properties[key].defaultValue = property.defaultValue;
    }

    // 如果folder schema对应key的prop存在
    if (this.folderSchema.properties[key]) {
      this.folderSchema.properties[key].default = property.default;
      this.folderSchema.properties[key].defaultValue = property.defaultValue;
    }
  }

  protected removePropFromSchemas(key: string): void {
    // If we remove a key from combined, it should also be removed from all narrower scopes.
    delete this.combinedSchema.properties[key];
    delete this.workspaceSchema.properties[key];
    delete this.folderSchema.properties[key];
  }
}
export const IPreferenceSchemaProvider = createServiceDecorator<IPreferenceSchemaProvider>(PreferenceSchemaProvider.name);
export type IPreferenceSchemaProvider = PreferenceSchemaProvider;
