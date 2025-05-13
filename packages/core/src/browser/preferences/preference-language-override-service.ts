import { InjectableService, PreferenceSchemaProperties, createServiceDecorator, escapeRegExpCharacters, isObject } from "@gepick/core/common";

export interface OverridePreferenceName {
  preferenceName: string;
  overrideIdentifier: string;
}
export namespace OverridePreferenceName {
  export function is(arg: unknown): arg is OverridePreferenceName {
    return isObject(arg) && 'preferenceName' in arg && 'overrideIdentifier' in arg;
  }
}

const OVERRIDE_PROPERTY = '\\[(.*)\\]$';
export const OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);
export const getOverridePattern = (identifier: string) => `\\[(${identifier})\\]$`;

export class PreferenceLanguageOverrideService extends InjectableService {
  protected readonly overrideIdentifiers = new Set<string>();

  testOverrideValue(name: string, value: unknown): value is PreferenceSchemaProperties {
    return PreferenceSchemaProperties.is(value) && OVERRIDE_PROPERTY_PATTERN.test(name);
  }

  /**
     * @param overrideIdentifier the language id associated for a language override, e.g. `typescript`
     * @returns the form used to mark language overrides in preference files, e.g. `[typescript]`
     */
  markLanguageOverride(overrideIdentifier: string): string {
    return `[${overrideIdentifier}]`;
  }

  /**
     * @returns the flat JSON path to an overridden preference, e.g. [typescript].editor.tabSize.
     */
  overridePreferenceName({ preferenceName, overrideIdentifier }: OverridePreferenceName): string {
    return `${this.markLanguageOverride(overrideIdentifier)}.${preferenceName}`;
  }

  /**
     * @returns an OverridePreferenceName if the `name` contains a language override, e.g. [typescript].editor.tabSize.
     */
  overriddenPreferenceName(name: string): OverridePreferenceName | undefined {
    const index = name.indexOf('.');
    if (index === -1) {
      return undefined;
    }
    const matches = name.substring(0, index).match(OVERRIDE_PROPERTY_PATTERN);
    const overrideIdentifier = matches && matches[1];
    if (!overrideIdentifier || !this.overrideIdentifiers.has(overrideIdentifier)) {
      return undefined;
    }
    const preferenceName = name.substring(index + 1);
    return { preferenceName, overrideIdentifier };
  }

  computeOverridePatternPropertiesKey(): string | undefined {
    let param: string = '';
    for (const overrideIdentifier of this.overrideIdentifiers) {
      if (param.length) {
        param += '|';
      }
      param += new RegExp(escapeRegExpCharacters(overrideIdentifier)).source;
    }
    return param.length ? getOverridePattern(param) : undefined;
  }

  *getOverridePreferenceNames(preferenceName: string): IterableIterator<string> {
    for (const overrideIdentifier of this.overrideIdentifiers) {
      yield this.overridePreferenceName({ preferenceName, overrideIdentifier });
    }
  }

  /**
     * @param overrideIdentifier
     * @returns true if the addition caused a change, i.e. if the identifier was not already present in the set of identifiers, false otherwise.
     */
  addOverrideIdentifier(overrideIdentifier: string): boolean {
    const alreadyPresent = this.overrideIdentifiers.has(overrideIdentifier);
    if (!alreadyPresent) {
      this.overrideIdentifiers.add(overrideIdentifier);
    }
    return !alreadyPresent;
  }

  /**
     * @param overrideIdentifier
     * @returns true if the deletion caused a change, i.e. if the identifier was present in the set, false otherwise.
     */
  removeOverrideIdentifier(overrideIdentifier: string): boolean {
    return this.overrideIdentifiers.delete(overrideIdentifier);
  }
}
export const IPreferenceLanguageOverrideService = createServiceDecorator<IPreferenceLanguageOverrideService>(PreferenceLanguageOverrideService.name);
export type IPreferenceLanguageOverrideService = PreferenceLanguageOverrideService;
