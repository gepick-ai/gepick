import { Contribution, Deferred, Emitter, InjectableService, PostConstruct, createServiceDecorator, deepFreeze, toDisposable } from "@gepick/core/common";
import { IApplicationContribution } from "../application";
import { IPreferencesSchema } from "./preferences-schema-contribution";
import { IPreferenceDiff, IPreferencesSchemaService } from "./preferences-schema-service";

const OVERRIDE_PROPERTY = '\\[(.*)\\]$';
export const OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);

export interface IOverridePreferenceName {
  preferenceName: string;
  overrideIdentifier: string;
}
export interface IPreferenceManager {}

@Contribution(IApplicationContribution)
export class PreferencesManager extends InjectableService implements IPreferenceManager {
  protected readonly _ready = new Deferred<void>();
  protected _isReady = false;

  protected readonly preferences: { [name: string]: any } = {};
  protected readonly combinedPreferencesSchema: IPreferencesSchema = { properties: {} };
  protected readonly overrideIdentifiers = new Set<string>();

  protected readonly _onPreferenceChanged = this._register(new Emitter<IPreferenceDiff>());
  readonly onPreferenceChanged = this._onPreferenceChanged.event;

  protected readonly _onPreferencesChanged = this._register(new Emitter<IPreferenceDiff[]>());
  readonly onPreferencesChanged = this._onPreferencesChanged.event;

  constructor(
    @IPreferencesSchemaService protected readonly preferencesSchemaService: IPreferencesSchemaService,
  ) {
    super();
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  @PostConstruct()
  protected init(): void {
    this._register(toDisposable(() => this._ready.reject(new Error('preference service is disposed'))));
    this.setupPreferences();
  }

  protected async setupPreferences(): Promise<void> {
    try {
      this._register(this.preferencesSchemaService.onDidPreferencesChanged((diffs) => {
        this.syncPreferences(diffs);
      }));
      const diffs = await this.preferencesSchemaService.ready;
      diffs.forEach(diff => this.preferences[diff.preferenceName] = diff.newValue);
      this._ready.resolve();
    }
    catch (e) {
      this._ready.reject(e);
    }
  }

  protected syncPreferences(diffs: IPreferenceDiff[]): void {
    const diffsToEmit: IPreferenceDiff[] = [];

    for (let diff of diffs) {
      if (diff.newValue === undefined) {
        const overriden = this.overridenPreferenceName(diff.preferenceName);
        if (overriden) {
          diff = {
            ...diff,
            newValue: this.getPreference(overriden.preferenceName),
          };
        }
      }

      this.getAffectedPreferenceNames(diff, (diff: IPreferenceDiff) => {
        diffsToEmit.push(diff);
      });
    }

    const changedPreferenceNames = diffsToEmit.map(diff => diff.preferenceName);
    if (changedPreferenceNames.length > 0) {
      this._onPreferencesChanged.fire(diffsToEmit);
    }
    diffs.forEach(diff => this._onPreferenceChanged.fire(diff));
  }

  protected getPreference<T>(preferenceName: string, defaultValue?: T) {
    const value = this.preferences[preferenceName];
    const result = value !== null && value !== undefined ? value : defaultValue;
    return deepFreeze(result);
  }

  protected getPreferences(): { [key: string]: any } {
    return this.preferences;
  }

  protected getAffectedPreferenceNames(diff: IPreferenceDiff, accept: (diff: IPreferenceDiff) => void): void {
    accept(diff);
  }

  *getOverridePreferenceNames(preferenceName: string): IterableIterator<string> {
    const preferenceSchema = this.preferencesSchemaService.getPreferenceSchema();
    const preference = preferenceSchema.properties[preferenceName];
    if (preference && preference.overridable) {
      for (const overrideIdentifier of this.overrideIdentifiers) {
        yield this.overridePreferenceName({ preferenceName, overrideIdentifier });
      }
    }
  }

  overridePreferenceName({ preferenceName, overrideIdentifier }: IOverridePreferenceName): string {
    return `[${overrideIdentifier}].${preferenceName}`;
  }

  overridenPreferenceName(name: string): IOverridePreferenceName | undefined {
    const index = name.indexOf('.');
    if (index === -1) {
      return undefined;
    }
    const matches = name.substr(0, index).match(OVERRIDE_PROPERTY_PATTERN);
    const overrideIdentifier = matches && matches[1];
    if (!overrideIdentifier || !this.overrideIdentifiers.has(overrideIdentifier)) {
      return undefined;
    }
    const preferenceName = name.substr(index + 1);
    return { preferenceName, overrideIdentifier };
  }

  inspectPreference(_preferenceName: string, _resourceUri?: string) {}

  get<T>(preferenceName: string): T | undefined;
  get<T>(preferenceName: string, defaultValue: T): T;
  get<T>(preferenceName: string, defaultValue: T, resourceUri: string): T;
  get<T>(preferenceName: string, defaultValue?: T, resourceUri?: string): T | undefined;
  get<T>(preferenceName: string, defaultValue?: T, _resourceUri?: string): T | undefined {
    const value = this.getPreference(preferenceName, defaultValue);
    if (value === null || value === undefined) {
      const overriden = this.overridenPreferenceName(preferenceName);
      if (overriden) {
        return this.getPreference(overriden.preferenceName, defaultValue);
      }
    }
    return value;
  }

  getBoolean(preferenceName: string): boolean | undefined;
  getBoolean(preferenceName: string, defaultValue: boolean): boolean;
  getBoolean(preferenceName: string, defaultValue: boolean, resourceUri: string): boolean;
  getBoolean(preferenceName: string, defaultValue?: boolean, resourceUri?: string): boolean | undefined {
    const value = resourceUri ? this.get(preferenceName, defaultValue, resourceUri) : this.get(preferenceName, defaultValue);
    return value !== null && value !== undefined ? !!value : defaultValue;
  }

  getString(preferenceName: string): string | undefined;
  getString(preferenceName: string, defaultValue: string): string;
  getString(preferenceName: string, defaultValue: string, resourceUri: string): string;
  getString(preferenceName: string, defaultValue?: string, resourceUri?: string): string | undefined {
    const value = resourceUri ? this.get(preferenceName, defaultValue, resourceUri) : this.get(preferenceName, defaultValue);
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return value.toString();
  }

  getNumber(preferenceName: string): number | undefined;
  getNumber(preferenceName: string, defaultValue: number): number;
  getNumber(preferenceName: string, defaultValue: number, resourceUri: string): number;
  getNumber(preferenceName: string, defaultValue?: number, resourceUri?: string): number | undefined {
    const value = resourceUri ? this.get(preferenceName, defaultValue, resourceUri) : this.get(preferenceName, defaultValue);
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'number') {
      return value;
    }
    return Number(value);
  }

  set(preferenceName: string, value: any): void {
    this.preferences[preferenceName] = value;
  }
}

export const IPreferencesManager = createServiceDecorator<IPreferencesManager>(PreferencesManager.name);
export type IPreferencesManager = PreferencesManager;
