import { URI } from "@gepick/core/common";

/**
 * Static methods for identifying a plugin as the target of the VSCode deployment system.
 * In practice, this means that it will be resolved and deployed by the Open-VSX system.
 */
export namespace VSCodeExtensionUri {
  export const SCHEME = 'vscode-extension';

  export function fromId(id: string, version?: string): URI {
    if (typeof version === 'string') {
      return new URI().withScheme(VSCodeExtensionUri.SCHEME).withAuthority(id).withPath(`/${version}`);
    }
    else {
      return new URI().withScheme(VSCodeExtensionUri.SCHEME).withAuthority(id);
    }
  }

  export function fromVersionedId(versionedId: string): URI {
    const versionAndId = versionedId.split('@');
    return fromId(versionAndId[0], versionAndId[1]);
  }

  export function toId(uri: URI): { id: string; version?: string } | undefined {
    if (uri.scheme === VSCodeExtensionUri.SCHEME) {
      return { id: uri.authority, version: uri.path.isRoot ? undefined : uri.path.base };
    }
    return undefined;
  }
}
