export enum PreferenceScope {
  Default,
  User,
  Workspace,
  Folder,
}

export namespace PreferenceScope {
  export function is(scope: unknown): scope is PreferenceScope {
    return typeof scope === 'number' && getScopes().includes(scope);
  }

  /**
     * @returns preference scopes from broadest to narrowest: Default -> Folder.
     */
  export function getScopes(): PreferenceScope[] {
    return Object.values(PreferenceScope).filter(nameOrIndex => !Number.isNaN(Number(nameOrIndex))) as PreferenceScope[];
  }

  /**
     * @returns preference scopes from narrowest to broadest. Folder -> Default.
     */
  export function getReversedScopes(): PreferenceScope[] {
    return getScopes().reverse();
  }

  export function getScopeNames(scope?: PreferenceScope): string[] {
    const names: string[] = [];
    const scopes = getScopes();
    if (scope) {
      for (const scopeIndex of scopes) {
        if (scopeIndex <= scope) {
          names.push(PreferenceScope[scopeIndex]);
        }
      }
    }
    return names;
  }

  export function fromString(strScope: string): PreferenceScope | undefined {
    switch (strScope) {
      case 'application':
        return PreferenceScope.User;
      case 'window':
        return PreferenceScope.Folder;
      case 'resource':
        return PreferenceScope.Folder;
      case 'language-overridable':
        return PreferenceScope.Folder;
    }

    return undefined;
  }
}
