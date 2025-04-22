import { Emitter, IServiceContainer, InjectableService, PostConstruct, ServiceIdUtil, createServiceDecorator, isObject } from "@gepick/core/common";
import { IPreferencesSchema } from "./preferences-schema-contribution";
import { IPreferencesManager } from "./preferences-manager";

// #region PreferenceProxyFactory
export class PreferencesProxyFactory extends InjectableService {
  constructor(
      @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createPreferencesProxy<T>(schema: IPreferencesSchema, _options: any = {}): T {
    const child = this.serviceContainer.createChild();
    child.bind(ServiceIdUtil.getServiceIdFromDecorator(IPreferencesSchema)).toConstantValue(schema);
    child.bind(PreferenceProxyHandler.getServiceId()).to(PreferenceProxyHandler);
    const preferenceProxyHandler = child.get<IPreferenceProxyHandler>(PreferenceProxyHandler.getServiceId());

    return new Proxy(Object.create(null), preferenceProxyHandler);
  }
}
export const IPreferencesProxyFactory = createServiceDecorator<IPreferencesProxyFactory>(PreferencesProxyFactory.name);
export type IPreferencesProxyFactory = PreferencesProxyFactory;
// #endregion

// #region PreferenceProxyHandler
export class PreferenceProxyHandler<T extends Record<string, any>> extends InjectableService implements ProxyHandler<T> {
  protected readonly _onPreferenceChanged = this._register(new Emitter());
  readonly onPreferenceChanged = this._onPreferenceChanged.event;

  constructor(
    @IPreferencesSchema protected readonly preferenceSchema: IPreferencesSchema,
    @IPreferencesManager protected readonly preferencesManager: IPreferencesManager,
    @IPreferencesProxyFactory protected readonly preferencesProxyFactory: IPreferencesProxyFactory,
  ) {
    super();
  }

  protected get style() {
    return 'flat';
  }

  protected get resourceUri(): string | undefined {
    return undefined;
  }

  protected get prefix(): string {
    return '';
  }

  protected get isDeep(): boolean {
    const { style } = this;
    return style === 'deep' || style === 'both';
  }

  protected get isFlat(): boolean {
    const { style } = this;
    return style === 'flat' || style === 'both';
  }

  protected get overrideIdentifier(): string | undefined {
    return undefined;
  }

  get(target: unknown, property: string, receiver: unknown): unknown {
    if (typeof property !== 'string') {
      throw new TypeError(`Unexpected property: ${String(property)}`);
    }
    const preferenceName = this.prefix + property;

    if (this.preferenceSchema && (this.isFlat || !property.includes('.')) && this.preferenceSchema.properties[preferenceName]) {
      const { overrideIdentifier } = this;
      const toGet = overrideIdentifier ? this.preferenceSchema.overridePreferenceName({ overrideIdentifier, preferenceName }) : preferenceName;
      return this.preferencesManager.get(toGet as keyof T & string, undefined!);
    }

    switch (property) {
      case 'onPreferenceChanged':
        return this.onPreferenceChanged;
      case 'dispose':
        return this.dispose;
      case 'ready':
        return Promise.all([this.preferencesManager.ready]).then(() => undefined);
      case 'get':
        return this.preferencesManager.get.bind(this.preferencesManager);
      case 'toJSON':
        return this.toJSON;
      case 'ownKeys':
        return this.ownKeys;
    }

    if (this.preferenceSchema && this.isDeep) {
      const prefix = `${preferenceName}.`;
      if (Object.keys(this.preferenceSchema.properties).some(key => key.startsWith(prefix))) {
        const { style, resourceUri, overrideIdentifier } = this;
        return this.preferencesProxyFactory.createPreferencesProxy(this.preferenceSchema, { prefix, resourceUri, style, overrideIdentifier });
      }
      let value: any;
      let parentSegment = preferenceName;
      const segments = [];
      do {
        const index = parentSegment.lastIndexOf('.');
        segments.push(parentSegment.substring(index + 1));
        parentSegment = parentSegment.substring(0, index);
        if (parentSegment in this.preferenceSchema.properties) {
          value = this.get(target, parentSegment, receiver);
        }
      } while (parentSegment && value === undefined);

      let segment;
      // eslint-disable-next-line no-cond-assign
      while (isObject(value) && (segment = segments.pop())) {
        value = value[segment];
      }
      return segments.length ? undefined : value;
    }

    throw new TypeError(`Unexpected property: ${String(property)}`);
  }

  set(_target: unknown, property: string, value: unknown, _receiver: unknown): boolean {
    if (typeof property !== 'string') {
      throw new TypeError(`Unexpected property: ${String(property)}`);
    }
    const { style, preferenceSchema, prefix, resourceUri, overrideIdentifier } = this;
    if (style === 'deep' && property.includes('.')) {
      return false;
    }
    if (preferenceSchema) {
      const fullProperty = prefix ? prefix + property : property;
      if (preferenceSchema.properties[fullProperty]) {
        this.preferencesManager.set(fullProperty, value);
        return true;
      }
      const newPrefix = `${fullProperty}.`;
      for (const p of Object.keys(preferenceSchema.properties)) {
        if (p.startsWith(newPrefix)) {
          const subProxy = this.preferencesProxyFactory.createPreferencesProxy<T>(preferenceSchema, {
            prefix: newPrefix,
            resourceUri,
            overrideIdentifier,
            style,
          }) as any;
          const valueAsContainer = value as T;
          for (const k of Object.keys(valueAsContainer)) {
            subProxy[k as keyof T] = valueAsContainer[k as keyof T];
          }
        }
      }
    }
    return false;
  }

  getOwnPropertyDescriptor(_target: unknown, property: string): PropertyDescriptor {
    if (this.ownKeys().includes(property)) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return {};
  }

  override dispose = (): void => {
    super.dispose();
  };

  toJSON = () => {
    const result: any = {};
    for (const key of this.ownKeys()) {
      result[key] = this.get(undefined, key, undefined) as any;
    }
    return result;
  };

  ownKeys = (): string[] => {
    return [];
  };

  deleteProperty(): never {
    throw new Error('Unsupported operation');
  }

  defineProperty(): never {
    throw new Error('Unsupported operation');
  }
}
export const IPreferenceProxyHandler = createServiceDecorator<IPreferenceProxyHandler>(PreferenceProxyHandler.name);
export interface IPreferenceProxyHandler extends ProxyHandler<any> {}
// #endregion

export abstract class PreferencesService<T> extends InjectableService {
  #proxy: T;
  #schema: IPreferencesSchema;

  @IPreferencesProxyFactory protected readonly preferencesProxyFactory: IPreferencesProxyFactory;

  constructor(preferencesSchema: IPreferencesSchema) {
    super();

    this.#schema = preferencesSchema;
  }

  @PostConstruct()
  protected init(): void {
    this.#proxy = this.preferencesProxyFactory.createPreferencesProxy(this.#schema);
  }

  get<K extends keyof T>(preference: K): T[K] {
    return this.#proxy[preference];
  }

  set<K extends keyof T>(preference: K, value: any): void {
    this.#proxy[preference] = value;
  }

  getPreferencesSchema() {
    return this.#schema;
  }
}
