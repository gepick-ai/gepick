import { Deferred, Emitter, InjectableService, PostConstruct, PreferenceScope, URI, createServiceDecorator, deepFreeze, toDisposable } from "@gepick/core/common";
import { JSONExt, JSONValue } from "@lumino/coreutils";
import { IPreferenceConfigurations } from "./preference-configurations";
import { IPreferenceSchemaProvider } from "./preference-schema-provider";
import { IPreferencesProvider, IPreferencesProviderProvider, PreferenceProvider, PreferenceProviderDataChange, PreferenceProviderDataChanges, PreferenceResolveResult } from "./preference-provider-contribution";

const OVERRIDE_PROPERTY = '\\[(.*)\\]$';
export const OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);

export interface IOverridePreferenceName {
  preferenceName: string;
  overrideIdentifier: string;
}

/**
 * Representation of a preference change. A preference value can be set to `undefined` for a specific scope.
 * This means that the value from a more general scope will be used.
 */
export interface PreferenceChange extends PreferenceProviderDataChange {
  /**
   * Tests wether the given resource is affected by the preference change.
   * @param resourceUri the uri of the resource to test.
   */
  affects: (resourceUri?: string) => boolean;
}

export class PreferenceChangeImpl implements PreferenceChange {
  protected readonly change: PreferenceProviderDataChange;
  constructor(change: PreferenceProviderDataChange) {
    this.change = deepFreeze(change);
  }

  get preferenceName(): string {
    return this.change.preferenceName;
  }

  get newValue(): string {
    return this.change.newValue;
  }

  get oldValue(): string {
    return this.change.oldValue;
  }

  get scope(): PreferenceScope {
    return this.change.scope;
  }

  get domain(): string[] | undefined {
    return this.change.domain;
  }

  // TODO add tests
  affects(resourceUri?: string): boolean {
    const resourcePath = resourceUri && new URI(resourceUri).path;
    const domain = this.change.domain;
    return !resourcePath || !domain || domain.some(uri => new URI(uri).path.relativity(resourcePath) >= 0);
  }
}

/**
 * A key-value storage for {@link PreferenceChange}s. Used to aggregate multiple simultaneous preference changes.
 */
export interface PreferenceChanges {
  [preferenceName: string]: PreferenceChange;
}

/**
 * Return type of the {@link PreferenceService.inspect} call.
 */
export interface PreferenceInspection<T = JSONValue> {
  /**
   * The preference identifier.
   */
  preferenceName: string;
  /**
   * Value in default scope.
   */
  defaultValue: T | undefined;
  /**
   * Value in user scope.
   */
  globalValue: T | undefined;
  /**
   * Value in workspace scope.
   */
  workspaceValue: T | undefined;
  /**
   * Value in folder scope.
   */
  workspaceFolderValue: T | undefined;
  /**
   * The value that is active, i.e. the value set in the lowest scope available.
   */
  value: T | undefined;
}

export type PreferenceInspectionScope = keyof Omit<PreferenceInspection<unknown>, 'preferenceName'>;

/**
* We cannot load providers directly in the case if they depend on `PreferenceService` somehow.
* It allows to load them lazily after DI is configured.
*/
export const PreferenceProviderProvider = Symbol('PreferenceProviderProvider');
export type PreferenceProviderProvider = (scope: PreferenceScope, uri?: URI) => IPreferencesProvider;

// #region PreferencesService

/**
 * PreferencesService作为外观模式中的Facade，封装所有 PreferenceProvider 的复杂性，对外提供统一的操作接口（如 getPreference 和 setPreference）。
 * - 具体作用：管理偏好设置
 *    - 获取偏好设置值
 *    - 设置偏好设置值
 *    - 监听偏好设置的变化
 * - 具体使用：两种方式是完全兼容的，Preferences Proxy内部就是使用的PreferenceService
 *    - 直接使用 PreferenceService
 *    - 使用Preferences Proxy
 * - 其他：外观模式（facade pattern）
 */
export class PreferencesService extends InjectableService implements IPreferencesService {
  protected readonly preferenceProviders = new Map<PreferenceScope, IPreferencesProvider>();

  protected readonly preferences: { [name: string]: any } = {};
  protected readonly overrideIdentifiers = new Set<string>();

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected _isReady = false;
  get isReady(): boolean {
    return this._isReady;
  }

  protected readonly onPreferenceChangedEmitter = this._register(new Emitter<PreferenceChange>());
  readonly onPreferenceChanged = this.onPreferenceChangedEmitter.event;

  protected readonly onPreferencesChangedEmitter = this._register(new Emitter<PreferenceChanges>());
  readonly onPreferencesChanged = this.onPreferencesChangedEmitter.event;

  /**
   * Handles deep equality with the possibility of `undefined`
   */
  static deepEqual(a: JSONValue | undefined, b: JSONValue | undefined): boolean {
    if (a === b) { return true; }
    if (a === undefined || b === undefined) { return false; }
    return JSONExt.deepEqual(a, b);
  }

  constructor(
    @IPreferenceConfigurations protected readonly configurations: IPreferenceConfigurations,
    @IPreferenceSchemaProvider protected readonly preferencesSchemaProvider: IPreferenceSchemaProvider,
    @IPreferencesProviderProvider protected readonly preferencesProviderProvider: IPreferencesProviderProvider,
  ) {
    super();
  }

  has(preferenceName: string, resourceUri?: string): boolean {
    return this.get(preferenceName, undefined, resourceUri) !== undefined;
  }

  /**
   * get preference就是从对应scope的preference provider中get preference
   */
  get<T>(preferenceName: string): T | undefined;
  get<T>(preferenceName: string, defaultValue: T): T;
  get<T>(preferenceName: string, defaultValue: T, resourceUri: string): T;
  get<T>(preferenceName: string, defaultValue?: T, resourceUri?: string): T | undefined;
  get<T>(preferenceName: string, defaultValue?: T, resourceUri?: string): T | undefined {
    return this.resolve<T>(preferenceName, defaultValue, resourceUri).value;
  }

  /**
   * set preference就是往对应scope的preference provider中set preference
   */
  async set(preferenceName: string, value: any, scope: PreferenceScope | undefined, resourceUri?: string): Promise<void> {
    const resolvedScope = scope ?? PreferenceScope.User;
    const provider = this.getProvider(resolvedScope);

    if (provider && await provider.setPreference(preferenceName, value, resourceUri)) {
      return;
    }
    throw new Error(`Unable to write to ${PreferenceScope[resolvedScope]} Settings.`);
  }

  resolve<T>(preferenceName: string, defaultValue?: T, resourceUri?: string): PreferenceResolveResult<T> {
    const { value, configUri } = this.doResolve(preferenceName, defaultValue, resourceUri);
    if (value === undefined) {
      const overridden = this.overriddenPreferenceName(preferenceName);
      if (overridden) {
        return this.doResolve(overridden.preferenceName, defaultValue, resourceUri);
      }
    }
    return { value, configUri };
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

  getConfigUri(scope: PreferenceScope, resourceUri?: string, sectionName: string = this.configurations.getConfigName()): URI | undefined {
    const provider = this.getProvider(scope);
    if (!provider || !this.configurations.isAnyConfig(sectionName)) {
      return undefined;
    }
    const configUri = provider.getConfigUri(resourceUri, sectionName);
    if (configUri) {
      return configUri;
    }
    return provider.getContainingConfigUri && provider.getContainingConfigUri(resourceUri, sectionName);
  }

  inspect<T extends JSONValue>(preferenceName: string, resourceUri?: string, forceLanguageOverride?: boolean): PreferenceInspection<T> | undefined {
    const defaultValue = this.inspectInScope<T>(preferenceName, PreferenceScope.Default, resourceUri, forceLanguageOverride);
    const globalValue = this.inspectInScope<T>(preferenceName, PreferenceScope.User, resourceUri, forceLanguageOverride);
    const workspaceValue = this.inspectInScope<T>(preferenceName, PreferenceScope.Workspace, resourceUri, forceLanguageOverride);
    const workspaceFolderValue = this.inspectInScope<T>(preferenceName, PreferenceScope.Folder, resourceUri, forceLanguageOverride);

    const valueApplied = workspaceFolderValue ?? workspaceValue ?? globalValue ?? defaultValue;

    return { preferenceName, defaultValue, globalValue, workspaceValue, workspaceFolderValue, value: valueApplied };
  }

  inspectInScope<T extends JSONValue>(preferenceName: string, scope: PreferenceScope, resourceUri?: string, forceLanguageOverride?: boolean): T | undefined {
    const value = this.doInspectInScope<T>(preferenceName, scope, resourceUri);
    if (value === undefined && !forceLanguageOverride) {
      const overridden = this.overriddenPreferenceName(preferenceName);
      if (overridden) {
        return this.doInspectInScope(overridden.preferenceName, scope, resourceUri);
      }
    }
    return value;
  }

  async updateValue(preferenceName: string, value: any, resourceUri?: string): Promise<void> {
    const inspection = this.inspect<any>(preferenceName, resourceUri);
    if (inspection) {
      const scopesToChange = this.getScopesToChange(inspection, value);
      const isDeletion = value === undefined
        || (scopesToChange.length === 1 && scopesToChange[0] === PreferenceScope.User && JSONExt.deepEqual(value, inspection.defaultValue));
      const effectiveValue = isDeletion ? undefined : value;
      await Promise.all(scopesToChange.map(scope => this.set(preferenceName, effectiveValue, scope, resourceUri)));
    }
  }

  overridePreferenceName(options: any): string {
    return options.preferenceName;
  }

  overriddenPreferenceName(_preferenceName: string): any | undefined {
    return undefined;
  }

  @PostConstruct()
  protected init(): void {
    this._register(toDisposable(() => this._ready.reject(new Error('preference service is disposed'))));
    this.initializeProviders();
  }

  /**
   * 收集所有preferences provider（逐一监听onDidPreferencesChanged,并逐一等待可用状态）
   */
  protected async initializeProviders(): Promise<void> {
    try {
      const preferencesProviders = this.preferencesProviderProvider.getContributions();

      for (const provider of preferencesProviders) {
        this.preferenceProviders.set(provider.getScope(), provider);
        this._register(provider.onDidPreferencesChanged((diffs) => {
          this.reconcilePreferences(diffs);
        }));

        await provider.ready;
      }

      this._ready.resolve();
      this._isReady = true;
    }
    catch (e) {
      this._ready.reject(e);
    }
  }

  /**
   * 协调changes里的具体每个change，过滤出真正需要变更的配置列表，将最终需要更新的配置过滤出来。
   */
  protected reconcilePreferences(changes: PreferenceProviderDataChanges): void {
    // PreferenceProviderDataChanges -> PreferenceChanges : 从一个结构过滤并包装成另一个结构（通过acceptChange(change)实现的）
    const changesToEmit: PreferenceChanges = {};
    const acceptChange = (change: PreferenceProviderDataChange) => {
      changesToEmit[change.preferenceName] = new PreferenceChangeImpl({ ...change });
    };

    for (const preferenceName of Object.keys(changes)) {
      let change = changes[preferenceName];

      for (const scope of PreferenceScope.getReversedScopes()) {
        // 判断preference在该scope中是不是一个合法的作用域配置
        if (this.preferencesSchemaProvider.isValidInScope(preferenceName, scope)) {
          // 如果是合法的配置，那么我们尝试获取对应scope的preference provider
          const provider = this.getProvider(scope);
          if (provider) {
            // 获取对应preference的值
            const value = provider.get(preferenceName);
            // 进入规则判断：当前provider scope的级别比change scope的级别要高，同时当前provider具有对应preference的具体值
            // 阻断本次变更
            if (scope > change.scope && value !== undefined) {
              // preference defined in a more specific scope
              break;
            }
            // 进入规则判断：如果当前preference 更改到的scope就是provider scoped，而且新值不为空
            // 接受本次变更
            else if (scope === change.scope && change.newValue !== undefined) {
              // preference is changed into something other than `undefined`
              acceptChange(change);
            }
            // 进入规则判断：如果当前provider的scope级别比change scope低，但是change新值置空，而当前provider不为空
            // 那么变更的新值就是provider的对应preference值。
            // 接受本次变更
            else if (scope < change.scope && change.newValue === undefined && value !== undefined) {
              // preference is changed to `undefined`, use the value from a more general scope
              change = {
                ...change,
                newValue: value,
                scope,
              };
              acceptChange(change);
            }
          }
        }
        // 如果不是任何scope中合法的配置：继续尝试判断change新值是否置空，同时这个scope属于默认的scope
        else if (change.newValue === undefined && change.scope === PreferenceScope.Default) {
          // preference is removed
          acceptChange(change);
          break;
        }
      }
    }

    // emit the changes
    const changedPreferenceNames = Object.keys(changesToEmit);
    if (changedPreferenceNames.length > 0) {
      this.onPreferencesChangedEmitter.fire(changesToEmit);
    }
    changedPreferenceNames.forEach(preferenceName => this.onPreferenceChangedEmitter.fire(changesToEmit[preferenceName]));
  }

  protected getAffectedPreferenceNames(change: PreferenceProviderDataChange, accept: (affectedPreferenceName: string) => void): void {
    accept(change.preferenceName);
  }

  protected getProvider(scope: PreferenceScope): IPreferencesProvider | undefined {
    return this.preferenceProviders.get(scope);
  }

  protected getScopedValueFromInspection<T>(inspection: PreferenceInspection<T>, scope: PreferenceScope): T | undefined {
    switch (scope) {
      case PreferenceScope.Default:
        return inspection.defaultValue;
      case PreferenceScope.User:
        return inspection.globalValue;
      case PreferenceScope.Workspace:
        return inspection.workspaceValue;
    }

    return undefined;
  }

  protected getScopesToChange(inspection: PreferenceInspection<any>, intendedValue: any): PreferenceScope[] {
    if (JSONExt.deepEqual(inspection.value, intendedValue)) {
      return [];
    }

    // Scopes in ascending order of scope breadth.
    const allScopes = PreferenceScope.getReversedScopes();
    // Get rid of Default scope. We can't set anything there.
    allScopes.pop();

    const isScopeDefined = (scope: PreferenceScope) => this.getScopedValueFromInspection(inspection, scope) !== undefined;

    if (intendedValue === undefined) {
      return allScopes.filter(isScopeDefined);
    }

    return [allScopes.find(isScopeDefined) ?? PreferenceScope.User];
  }

  protected doHas(preferenceName: string, resourceUri?: string): boolean {
    return this.doGet(preferenceName, undefined, resourceUri) !== undefined;
  }

  protected doInspectInScope<T>(preferenceName: string, scope: PreferenceScope, resourceUri?: string): T | undefined {
    const provider = this.getProvider(scope);
    return provider && provider.get<T>(preferenceName, resourceUri);
  }

  protected doGet<T>(preferenceName: string, defaultValue?: T, resourceUri?: string): T | undefined {
    return this.doResolve(preferenceName, defaultValue, resourceUri).value;
  }

  protected doResolve<T>(preferenceName: string, defaultValue?: T, resourceUri?: string): PreferenceResolveResult<T> {
    const result: PreferenceResolveResult<T> = {};
    for (const scope of PreferenceScope.getScopes()) {
      if (this.preferencesSchemaProvider.isValidInScope(preferenceName, scope)) {
        const provider = this.getProvider(scope);
        if (provider?.canHandleScope(scope)) {
          const { configUri, value } = provider.resolve<T>(preferenceName, resourceUri);
          if (value !== undefined) {
            result.configUri = configUri;
            result.value = PreferenceProvider.merge(result.value as any, value as any) as any;
          }
        }
      }
    }
    return {
      configUri: result.configUri,
      value: result.value !== undefined ? deepFreeze(result.value) : defaultValue,
    };
  }
}

export const IPreferencesService = createServiceDecorator<IPreferencesService>(PreferencesService.name);
export type IPreferencesService = PreferencesService;

// #endregion
