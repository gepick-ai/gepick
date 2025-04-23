import { Ajv, Deferred, Emitter, IContributionProvider, InjectableService, Optional, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPreferencesSchema, IPreferencesSchemaProvider } from "./preferences-schema-contribution";

export interface IPreferenceDiff {
  /**
   * The name of the changed preference.
   */
  preferenceName: string;
  /**
   * The new value of the changed preference.
   */
  newValue?: any;
  /**
   * The old value of the changed preference.
   */
  oldValue?: any;
}

export class PreferencesSchemaService extends InjectableService {
  protected readonly _ready = new Deferred<IPreferenceDiff[]>();

  protected readonly preferencesSchema: IPreferencesSchema = { properties: {} };
  protected preferenceSchemaValidateFunction: Ajv.ValidateFunction;

  protected readonly _onDidPreferenceSchemaChanged = this._register(new Emitter<void>());
  readonly onDidPreferenceSchemaChanged = this._onDidPreferenceSchemaChanged.event;

  protected readonly _onDidPreferencesChanged = this._register(new Emitter<IPreferenceDiff[]>());
  readonly onDidPreferencesChanged = this._onDidPreferencesChanged.event;

  constructor(
    @Optional() @IPreferencesSchemaProvider protected readonly preferenceSchemaProvider: IContributionProvider<IPreferencesSchema>,
  ) {
    super();
  }

  get ready() {
    return this._ready.promise;
  }

  @PostConstruct()
  protected init(): void {
    const preferencesSchemaList = this.preferenceSchemaProvider.getContributions();

    const diffs = preferencesSchemaList.map(preferencesSchema => this.setPreferenceSchema(preferencesSchema)).flat();

    this.onDidPreferencesChanged(() => this.updatePreferenceSchemaValidateFunction());
    this.updatePreferenceSchemaValidateFunction();
    this._ready.resolve(diffs);
  }

  protected setPreferenceSchema(preferenceSchema: IPreferencesSchema): IPreferenceDiff[] {
    this.validatePreferenceSchema(preferenceSchema);

    const overridable = preferenceSchema.overridable || false;
    const preferenceDiffs: IPreferenceDiff[] = [];

    for (const preferenceName of Object.keys(preferenceSchema.properties)) {
      if (this.preferencesSchema.properties[preferenceName]) {
        console.error(`Preference name collision detected in the schema for property: ${preferenceName}`);
      }
      else {
        const prop = preferenceSchema.properties[preferenceName];
        if (typeof prop.overridable !== 'boolean' && overridable) {
          prop.overridable = true;
        }

        this.preferencesSchema.properties[preferenceName] = prop;

        const defaultValue = this.getDefaultPreferenceValueBySchemaProp(prop);
        prop.default = defaultValue;
        preferenceDiffs.push({
          preferenceName,
          newValue: defaultValue,
        });
      }
    }

    this._onDidPreferencesChanged.fire(preferenceDiffs);
    return preferenceDiffs;
  }

  protected validatePreferenceSchema(preferenceSchema: IPreferencesSchema) {
    const ajv = new Ajv();
    const valid = ajv.validateSchema(preferenceSchema);
    if (!valid) {
      const errors = ajv.errors ? ajv.errorsText(ajv.errors) : 'unknown validation error';
      console.warn(`A contributed preference schema has validation issues : ${errors}`);
    }
  }

  protected updatePreferenceSchemaValidateFunction(): void {
    this.preferenceSchemaValidateFunction = new Ajv().compile(this.preferencesSchema);
  }

  protected getDefaultPreferenceValueBySchemaProp(prop: any): any {
    if (prop.default) {
      return prop.default;
    }

    const type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
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

  getPreferenceSchema() {
    return this.preferencesSchema;
  }
}

export const IPreferencesSchemaService = createServiceDecorator<IPreferencesSchemaService>(PreferencesSchemaService.name);
export type IPreferencesSchemaService = PreferencesSchemaService;
