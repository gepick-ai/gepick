import { JSONValue } from '@lumino/coreutils';
import { IJSONSchema } from '../json-schema';
import { isObject, isString } from '../types';
import { PreferenceScope } from './preference-scope';

export interface PreferenceSchema {
  [name: string]: any;
  scope?: 'application' | 'window' | 'resource' | PreferenceScope;
  overridable?: boolean;
  /**
     * The title of the preference schema.
     * It is used in the preference UI to associate a localized group of preferences.
     */
  title?: string;
  properties: PreferenceSchemaProperties;
}
export namespace PreferenceSchema {
  export function is(obj: unknown): obj is PreferenceSchema {
    return isObject<PreferenceSchema>(obj) && PreferenceSchemaProperties.is(obj.properties);
  }
  export function getDefaultScope(schema: PreferenceSchema): PreferenceScope {
    let defaultScope: PreferenceScope = PreferenceScope.Workspace;
    if (!PreferenceScope.is(schema.scope)) {
      defaultScope = PreferenceScope.fromString(<string>schema.scope) || PreferenceScope.Workspace;
    }
    else {
      defaultScope = schema.scope;
    }
    return defaultScope;
  }
}

export interface PreferenceSchemaProperties {
  [name: string]: PreferenceSchemaProperty;
}
export namespace PreferenceSchemaProperties {
  export function is(obj: unknown): obj is PreferenceSchemaProperties {
    return isObject(obj);
  }
}

export interface PreferenceDataSchema {
  [name: string]: any;
  scope?: PreferenceScope;
  properties: {
    [name: string]: PreferenceDataProperty;
  };
  patternProperties: {
    [name: string]: PreferenceDataProperty;
  };
}

export interface PreferenceItem extends IJSONSchema {
  /**
     * preference default value, if `undefined` then `default`
     */
  defaultValue?: JSONValue;
  overridable?: boolean;
  /** If false, the preference will not be included in the schema or the UI. */
  included?: boolean;
  /** If true, this item will registered as part of the preference schema, but hidden in the preference editor UI. */
  hidden?: boolean;
  [key: string]: any;
}
export interface PreferenceSchemaProperty extends PreferenceItem {
  description?: string;
  markdownDescription?: string;
  scope?: 'application' | 'machine' | 'window' | 'resource' | 'language-overridable' | 'machine-overridable' | PreferenceScope;
  tags?: string[];
}

export interface PreferenceDataProperty extends PreferenceItem {
  description?: string;
  markdownDescription?: string;
  scope?: PreferenceScope;
  typeDetails?: any;
}
export namespace PreferenceDataProperty {
  /**
     * 将PreferenceSchemaProperty转成PreferenceDataProperty
     * 如果：schemaProps.scope不存在，使用defaultScope
     * 如果：schemaProps.scope存在，但是是字符串，那么将schemaProps.scope转换成PreferenceScope
     */
  export function fromPreferenceSchemaProperty(schemaProps: PreferenceSchemaProperty, defaultScope: PreferenceScope = PreferenceScope.Workspace): PreferenceDataProperty {
    if (!schemaProps.scope) {
      schemaProps.scope = defaultScope;
    }
    else if (isString(schemaProps.scope)) {
      return Object.assign(schemaProps, { scope: PreferenceScope.fromString(schemaProps.scope) || defaultScope });
    }
    return <PreferenceDataProperty>schemaProps;
  }
}
