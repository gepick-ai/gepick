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

/**
 * Should be aligned with https://github.com/eclipse/openvsx/blob/master/server/src/main/java/org/eclipse/openvsx/json/ExtensionJson.java
 */
export interface VSXExtensionRaw {
  error?: string;
  namespaceUrl: string;
  reviewsUrl: string;
  name: string;
  namespace: string;
  targetPlatform?: any;
  publishedBy: any;
  preRelease: boolean;
  namespaceAccess: any;
  files: any;
  allVersions: {
    [version: string]: string;
  };
  allVersionsUrl?: string;
  averageRating?: number;
  downloadCount: number;
  reviewCount: number;
  version: string;
  timestamp: string;
  preview?: boolean;
  verified?: boolean;
  displayName?: string;
  namespaceDisplayName: string;
  description?: string;
  categories?: string[];
  extensionKind?: string[];
  tags?: string[];
  license?: string;
  homepage?: string;
  repository?: string;
  sponsorLink?: string;
  bugs?: string;
  markdown?: string;
  galleryColor?: string;
  galleryTheme?: string;
  localizedLanguages?: string[];
  qna?: string;
  badges?: any[];
  dependencies?: any[];
  bundledExtensions?: any[];
  allTargetPlatformVersions?: any[];
  url?: string;
  engines?: {
    [engine: string]: string;
  };
}
