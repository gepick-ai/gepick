import { CancellationToken, CancellationTokenSource, Emitter, Event, InjectableService, PostConstruct, URI, createServiceDecorator, pDebounce } from "@gepick/core/common";
import { DOMPurify, markdownit, messagingService } from "@gepick/core/browser";
import { ISearchModel } from "../search";
import { IPlugin, IPluginFactory, PluginOptions } from "./plugin";

export class PluginsModel extends InjectableService {
  protected initialized: Promise<void>;
  /**
   * Single source for all extensions
   */
  protected readonly extensions = new Map<string, any>();
  protected readonly onDidChangeEmitter = new Emitter<void>();
  protected _installed = new Set<string>();
  protected _recommended = new Set<string>();
  protected _searchResult = new Set<string>();
  protected _searchError?: string;

  protected searchCancellationTokenSource = new CancellationTokenSource();

  constructor(
    @ISearchModel readonly search: ISearchModel,
    @IPluginFactory protected readonly extensionFactory: IPluginFactory,
  ) {
    super();
  }

  get onDidChange(): Event<void> {
    return this.onDidChangeEmitter.event;
  }

  get installed(): IterableIterator<string> {
    return this._installed.values();
  }

  get searchError(): string | undefined {
    return this._searchError;
  }

  get searchResult(): IterableIterator<string> {
    return this._searchResult.values();
  }

  @PostConstruct()
  protected init(): void {
    this.initialized = this.doInit().catch(console.error);
  }

  protected async doInit(): Promise<void> {
    await Promise.all([
      this.initInstalled(),
      this.initSearchResult(),
    ]);
  }

  protected async initInstalled(): Promise<void> {
    // await this.pluginSupport.willStart;
    try {
      await this.updateInstalled();
    }
    catch (e) {
      console.error(e);
    }
  }

  protected async initSearchResult(): Promise<void> {
    this.search.onDidChangeQuery(() => this.updateSearchResult());
    try {
      await this.updateSearchResult();
    }
    catch (e) {
      console.error(e);
    }
  }

  isInstalled(id: string): boolean {
    return this._installed.has(id);
  }

  getExtension(id: string): any | undefined {
    return this.extensions.get(id);
  }

  protected setExtension(id: string) {
    let extension = this.extensions.get(id);
    if (!extension) {
      extension = this.extensionFactory.createPlugin(new PluginOptions(id));
      this.extensions.set(id, extension);
    }
    return extension;
  }

  protected async updateInstalled(): Promise<void> {
    // TODO(@jaylenchen): 接入实际的plugin data
    const mockDatas = [
      {
        namespaceUrl: "https://open-vsx.org/api/dbaeumer",
        reviewsUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/reviews",
        files: {
          license: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/License.txt",
          icon: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/eslint_icon.png",
          vsixmanifest: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.sha256",
          download: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
          manifest: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/package.json",
          readme: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/README.md",
          changelog: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/CHANGELOG.md",
          signature: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.sigzip",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "vscode-eslint",
        namespace: "dbaeumer",
        targetPlatform: "universal",
        version: "3.0.10",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersionsUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/versions",
        averageRating: 5,
        downloadCount: 1548366,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2024-06-18T03:29:07.108336Z",
        preview: false,
        displayName: "ESLint",
        namespaceDisplayName: "dbaeumer",
        description: "Integrates ESLint JavaScript into VS Code.",
        engines: {
          vscode: "^1.90.0",
        },
        categories: [
          "Programming Languages",
          "Linters",
        ],
        extensionKind: [
          "workspace",
        ],
        tags: [
          "__ext_eslintignore",
          "ignore",
          "javascript",
          "json",
          "jsonc",
          "linters",
          "multi-root ready",
        ],
        license: "MIT",
        homepage: "https://github.com/Microsoft/vscode-eslint#readme",
        repository: "https://github.com/Microsoft/vscode-eslint.git",
        sponsorLink: "",
        bugs: "https://github.com/Microsoft/vscode-eslint/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/3.0.10",
        deprecated: false,
        downloadable: true,
        id: "dbaeumer.vscode-eslint",
        publisher: "dbaeumer",
        downloadUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
        iconUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/eslint_icon.png",
        readmeUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/README.md",
        licenseUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/License.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/dbaeumer",
        reviewsUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/reviews",
        files: {
          license: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/License.txt",
          icon: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/eslint_icon.png",
          vsixmanifest: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.sha256",
          download: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
          manifest: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/package.json",
          readme: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/README.md",
          changelog: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/CHANGELOG.md",
          signature: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.sigzip",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "vscode-eslint",
        namespace: "dbaeumer",
        targetPlatform: "universal",
        version: "3.0.10",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersionsUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/versions",
        averageRating: 5,
        downloadCount: 1548366,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2024-06-18T03:29:07.108336Z",
        preview: false,
        displayName: "ESLint",
        namespaceDisplayName: "dbaeumer",
        description: "Integrates ESLint JavaScript into VS Code.",
        engines: {
          vscode: "^1.90.0",
        },
        categories: [
          "Programming Languages",
          "Linters",
        ],
        extensionKind: [
          "workspace",
        ],
        tags: [
          "__ext_eslintignore",
          "ignore",
          "javascript",
          "json",
          "jsonc",
          "linters",
          "multi-root ready",
        ],
        license: "MIT",
        homepage: "https://github.com/Microsoft/vscode-eslint#readme",
        repository: "https://github.com/Microsoft/vscode-eslint.git",
        sponsorLink: "",
        bugs: "https://github.com/Microsoft/vscode-eslint/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/3.0.10",
        deprecated: false,
        downloadable: true,
        id: "dbaeumer.vscode-eslint",
        publisher: "dbaeumer",
        downloadUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
        iconUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/eslint_icon.png",
        readmeUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/README.md",
        licenseUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/License.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/DavidAnson",
        reviewsUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/reviews",
        files: {
          manifest: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/package.json",
          readme: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/readme.md",
          changelog: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/changelog.md",
          license: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/LICENSE.txt",
          download: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.vsix",
          signature: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.sigzip",
          icon: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/markdownlint-128.png",
          vsixmanifest: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.sha256",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "vscode-markdownlint",
        namespace: "DavidAnson",
        targetPlatform: "universal",
        version: "0.59.0",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersionsUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/universal/versions",
        averageRating: 5,
        downloadCount: 226284,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2025-02-19T03:17:11.895127Z",
        preview: false,
        displayName: "markdownlint",
        namespaceDisplayName: "DavidAnson",
        description: "Markdown linting and style checking for Visual Studio Code",
        engines: {
          node: ">=16",
          vscode: "^1.75.0",
        },
        categories: [
          "Linters",
          "Formatters",
        ],
        extensionKind: [
          "workspace",
          "web",
        ],
        tags: [
          "__sponsor_extension",
          "__web_extension",
          "CommonMark",
          "json",
          "lint",
          "linters",
          "markdown",
          "md",
          "multi-root ready",
          "snippet",
        ],
        license: "MIT",
        homepage: "https://github.com/DavidAnson/vscode-markdownlint",
        repository: "https://github.com/DavidAnson/vscode-markdownlint.git",
        sponsorLink: "https://github.com/sponsors/DavidAnson",
        bugs: "https://github.com/DavidAnson/vscode-markdownlint/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/universal/0.59.0",
        deprecated: false,
        downloadable: true,
        id: "DavidAnson.vscode-markdownlint",
        publisher: "DavidAnson",
        downloadUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.vsix",
        iconUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/markdownlint-128.png",
        readmeUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/readme.md",
        licenseUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/LICENSE.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/DavidAnson",
        reviewsUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/reviews",
        files: {
          manifest: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/package.json",
          readme: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/readme.md",
          changelog: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/changelog.md",
          license: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/LICENSE.txt",
          download: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.vsix",
          signature: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.sigzip",
          icon: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/markdownlint-128.png",
          vsixmanifest: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.sha256",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "vscode-markdownlint",
        namespace: "DavidAnson",
        targetPlatform: "universal",
        version: "0.59.0",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersionsUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/universal/versions",
        averageRating: 5,
        downloadCount: 226284,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2025-02-19T03:17:11.895127Z",
        preview: false,
        displayName: "markdownlint",
        namespaceDisplayName: "DavidAnson",
        description: "Markdown linting and style checking for Visual Studio Code",
        engines: {
          node: ">=16",
          vscode: "^1.75.0",
        },
        categories: [
          "Linters",
          "Formatters",
        ],
        extensionKind: [
          "workspace",
          "web",
        ],
        tags: [
          "__sponsor_extension",
          "__web_extension",
          "CommonMark",
          "json",
          "lint",
          "linters",
          "markdown",
          "md",
          "multi-root ready",
          "snippet",
        ],
        license: "MIT",
        homepage: "https://github.com/DavidAnson/vscode-markdownlint",
        repository: "https://github.com/DavidAnson/vscode-markdownlint.git",
        sponsorLink: "https://github.com/sponsors/DavidAnson",
        bugs: "https://github.com/DavidAnson/vscode-markdownlint/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/universal/0.59.0",
        deprecated: false,
        downloadable: true,
        id: "DavidAnson.vscode-markdownlint",
        publisher: "DavidAnson",
        downloadUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/DavidAnson.vscode-markdownlint-0.59.0.vsix",
        iconUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/markdownlint-128.png",
        readmeUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/readme.md",
        licenseUrl: "https://open-vsx.org/api/DavidAnson/vscode-markdownlint/0.59.0/file/LICENSE.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/ms-vscode",
        reviewsUrl: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/reviews",
        files: {
          download: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/ms-vscode.vscode-github-issue-notebooks-0.0.130.vsix",
          manifest: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/package.json",
          readme: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/README.md",
          license: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/LICENSE.txt",
          icon: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/icon.png",
          vsixmanifest: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/ms-vscode.vscode-github-issue-notebooks-0.0.130.sha256",
          signature: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/ms-vscode.vscode-github-issue-notebooks-0.0.130.sigzip",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "vscode-github-issue-notebooks",
        namespace: "ms-vscode",
        targetPlatform: "universal",
        version: "0.0.130",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersions: {
          "latest": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/latest",
          "0.0.130": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.130",
          "0.0.129": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.129",
          "0.0.128": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.128",
          "0.0.127": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.127",
          "0.0.126": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.126",
          "0.0.124": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.124",
          "0.0.121": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.121",
          "0.0.119": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.119",
          "0.0.117": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.117",
          "0.0.116": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.116",
          "0.0.115": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.115",
          "0.0.113": "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.113",
        },
        allVersionsUrl: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/versions",
        downloadCount: 5957,
        reviewCount: 0,
        versionAlias: [
          "latest",
        ],
        timestamp: "2023-09-27T03:52:13.272585Z",
        preview: true,
        displayName: "GitHub Issue Notebooks",
        namespaceDisplayName: "ms-vscode",
        description: "GitHub Issue Notebooks for VS Code",
        engines: {
          vscode: "^1.72.0-insider",
        },
        categories: [
          "Other",
        ],
        extensionKind: [
          "workspace",
          "web",
        ],
        tags: [
          "__web_extension",
          "GitHub Issues",
          "github-issues",
        ],
        license: "MIT",
        homepage: "https://github.com/microsoft/vscode-github-issue-notebooks#readme",
        repository: "https://github.com/microsoft/vscode-github-issue-notebooks.git",
        sponsorLink: "",
        bugs: "https://github.com/microsoft/vscode-github-issue-notebooks/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/universal/0.0.130",
        deprecated: false,
        downloadable: true,
        model: {
          packagePath: "/Users/jaylen/.theia/deployedPlugins/ms-vscode.vscode-github-issue-notebooks-0.0.130/extension",
          packageUri: "file:///Users/jaylen/.theia/deployedPlugins/ms-vscode.vscode-github-issue-notebooks-0.0.130/extension",
          id: "ms-vscode.vscode-github-issue-notebooks",
          name: "vscode-github-issue-notebooks",
          publisher: "ms-vscode",
          version: "0.0.130",
          displayName: "GitHub Issue Notebooks",
          description: "GitHub Issue Notebooks for VS Code",
          engine: {
            type: "vscode",
            version: "^1.72.0-insider",
          },
          entryPoint: {
            backend: "/Users/jaylen/.theia/deployedPlugins/ms-vscode.vscode-github-issue-notebooks-0.0.130/extension/dist/extension-node.js",
          },
          iconUrl: "hostedPlugin/ms_vscode_vscode_github_issue_notebooks/icon.png",
          l10n: "./l10n",
          readmeUrl: "hostedPlugin/ms_vscode_vscode_github_issue_notebooks/.%2FREADME.md",
          licenseUrl: "hostedPlugin/ms_vscode_vscode_github_issue_notebooks/.%2FLICENSE",
        },
        id: "ms-vscode.vscode-github-issue-notebooks",
        publisher: "ms-vscode",
        downloadUrl: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/ms-vscode.vscode-github-issue-notebooks-0.0.130.vsix",
        iconUrl: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/icon.png",
        readmeUrl: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/README.md",
        licenseUrl: "https://open-vsx.org/api/ms-vscode/vscode-github-issue-notebooks/0.0.130/file/LICENSE.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/dbaeumer",
        reviewsUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/reviews",
        files: {
          license: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/License.txt",
          icon: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/eslint_icon.png",
          vsixmanifest: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.sha256",
          download: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
          manifest: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/package.json",
          readme: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/README.md",
          changelog: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/CHANGELOG.md",
          signature: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.sigzip",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "vscode-eslint",
        namespace: "dbaeumer",
        targetPlatform: "universal",
        version: "3.0.10",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersions: {
          "latest": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/latest",
          "3.0.10": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/3.0.10",
          "2.4.4": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.4.4",
          "2.4.2": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.4.2",
          "2.4.0": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.4.0",
          "2.2.6": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.2.6",
          "2.2.2": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.2.2",
          "2.1.20": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.1.20",
          "2.1.8": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.1.8",
          "2.1.3": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.1.3",
          "2.1.1": "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/2.1.1",
        },
        allVersionsUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/versions",
        averageRating: 5,
        downloadCount: 1548350,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2024-06-18T03:29:07.108336Z",
        preview: false,
        displayName: "ESLint",
        namespaceDisplayName: "dbaeumer",
        description: "Integrates ESLint JavaScript into VS Code.",
        engines: {
          vscode: "^1.90.0",
        },
        categories: [
          "Programming Languages",
          "Linters",
        ],
        extensionKind: [
          "workspace",
        ],
        tags: [
          "__ext_eslintignore",
          "ignore",
          "javascript",
          "json",
          "jsonc",
          "linters",
          "multi-root ready",
        ],
        license: "MIT",
        homepage: "https://github.com/Microsoft/vscode-eslint#readme",
        repository: "https://github.com/Microsoft/vscode-eslint.git",
        sponsorLink: "",
        bugs: "https://github.com/Microsoft/vscode-eslint/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/dbaeumer/vscode-eslint/universal/3.0.10",
        deprecated: false,
        downloadable: true,
        model: {
          packagePath: "/Users/jaylen/.theia/deployedPlugins/dbaeumer.vscode-eslint-3.0.10/extension",
          packageUri: "file:///Users/jaylen/.theia/deployedPlugins/dbaeumer.vscode-eslint-3.0.10/extension",
          id: "dbaeumer.vscode-eslint",
          name: "vscode-eslint",
          publisher: "dbaeumer",
          version: "3.0.10",
          displayName: "ESLint",
          description: "Integrates ESLint JavaScript into VS Code.",
          engine: {
            type: "vscode",
            version: "^1.90.0",
          },
          entryPoint: {
            backend: "/Users/jaylen/.theia/deployedPlugins/dbaeumer.vscode-eslint-3.0.10/extension/client/out/extension",
          },
          iconUrl: "hostedPlugin/dbaeumer_vscode_eslint/eslint_icon.png",
          readmeUrl: "hostedPlugin/dbaeumer_vscode_eslint/.%2FREADME.md",
          licenseUrl: "hostedPlugin/dbaeumer_vscode_eslint/.%2FLICENSE",
        },
        id: "dbaeumer.vscode-eslint",
        publisher: "dbaeumer",
        downloadUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/dbaeumer.vscode-eslint-3.0.10.vsix",
        iconUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/eslint_icon.png",
        readmeUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/README.md",
        licenseUrl: "https://open-vsx.org/api/dbaeumer/vscode-eslint/3.0.10/file/License.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/dracula-theme",
        reviewsUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/reviews",
        files: {
          download: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/dracula-theme.theme-dracula-2.25.1.vsix",
          signature: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/dracula-theme.theme-dracula-2.25.1.sigzip",
          manifest: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/package.json",
          readme: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/README.md",
          changelog: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/CHANGELOG.md",
          license: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/LICENSE.txt",
          icon: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/icon.png",
          vsixmanifest: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/dracula-theme.theme-dracula-2.25.1.sha256",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "theme-dracula",
        namespace: "dracula-theme",
        targetPlatform: "universal",
        version: "2.25.1",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersions: {
          "latest": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/latest",
          "2.25.1": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.25.1",
          "2.25.0": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.25.0",
          "2.24.2": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.24.2",
          "2.24.1": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.24.1",
          "2.24.0": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.24.0",
          "2.23.1": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.23.1",
          "2.23.0": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.23.0",
          "2.22.4": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.22.4",
          "2.22.3": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.22.3",
          "2.22.2": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.22.2",
          "2.22.1": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.22.1",
          "2.22.0": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.22.0",
          "2.21.0": "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.21.0",
        },
        allVersionsUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/versions",
        averageRating: 5,
        downloadCount: 152771,
        reviewCount: 2,
        versionAlias: [
          "latest",
        ],
        timestamp: "2024-09-06T03:29:53.212374Z",
        preview: false,
        displayName: "Dracula Theme Official",
        namespaceDisplayName: "dracula-theme",
        description: "The official Dracula Theme: a dark theme for many editors, shells, and more. 🦇",
        engines: {
          vscode: "^1.13.0",
        },
        categories: [
          "Themes",
        ],
        extensionKind: [
          "ui",
          "workspace",
          "web",
        ],
        tags: [
          "__web_extension",
          "color-theme",
          "dark",
          "dracula",
          "theme",
        ],
        license: "MIT",
        homepage: "https://draculatheme.com/",
        repository: "https://github.com/dracula/visual-studio-code.git",
        sponsorLink: "",
        bugs: "https://github.com/dracula/visual-studio-code/issues",
        galleryColor: "#3c4557",
        galleryTheme: "dark",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/dracula-theme/theme-dracula/universal/2.25.1",
        deprecated: false,
        downloadable: true,
        model: {
          packagePath: "/Users/jaylen/.theia/deployedPlugins/dracula-theme.theme-dracula-2.25.1/extension",
          packageUri: "file:///Users/jaylen/.theia/deployedPlugins/dracula-theme.theme-dracula-2.25.1/extension",
          id: "dracula-theme.theme-dracula",
          name: "theme-dracula",
          publisher: "dracula-theme",
          version: "2.25.1",
          displayName: "Dracula Theme Official",
          description: "The official Dracula Theme: a dark theme for many editors, shells, and more. 🦇",
          engine: {
            type: "vscode",
            version: "^1.13.0",
          },
          entryPoint: {},
          iconUrl: "hostedPlugin/dracula_theme_theme_dracula/icon.png",
          readmeUrl: "hostedPlugin/dracula_theme_theme_dracula/.%2FREADME.md",
          licenseUrl: "hostedPlugin/dracula_theme_theme_dracula/.%2FLICENSE",
        },
        id: "dracula-theme.theme-dracula",
        publisher: "dracula-theme",
        downloadUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/dracula-theme.theme-dracula-2.25.1.vsix",
        iconUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/icon.png",
        readmeUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/README.md",
        licenseUrl: "https://open-vsx.org/api/dracula-theme/theme-dracula/2.25.1/file/LICENSE.txt",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/EditorConfig",
        reviewsUrl: "https://open-vsx.org/api/EditorConfig/EditorConfig/reviews",
        files: {
          download: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/EditorConfig.EditorConfig-0.17.2.vsix",
          signature: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/EditorConfig.EditorConfig-0.17.2.sigzip",
          manifest: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/package.json",
          readme: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/readme.md",
          changelog: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/changelog.md",
          license: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/LICENSE.md",
          icon: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/EditorConfig_icon.png",
          vsixmanifest: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/EditorConfig.EditorConfig-0.17.2.sha256",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "EditorConfig",
        namespace: "EditorConfig",
        targetPlatform: "universal",
        version: "0.17.2",
        preRelease: false,
        publishedBy: {
          loginName: "open-vsx",
          fullName: "Open VSX",
          avatarUrl: "https://avatars0.githubusercontent.com/u/61870837?v=4",
          homepage: "https://github.com/open-vsx",
          provider: "github",
        },
        verified: true,
        unrelatedPublisher: false,
        namespaceAccess: "restricted",
        allVersions: {
          "latest": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/latest",
          "0.17.2": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.17.2",
          "0.17.1": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.17.1",
          "0.17.0": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.17.0",
          "0.16.7": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.16.7",
          "0.16.6": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.16.6",
          "0.16.5": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.16.5",
          "0.16.4": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.16.4",
          "0.16.3": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.16.3",
          "0.15.1": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.15.1",
          "0.14.5": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.14.5",
          "0.14.4": "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.14.4",
        },
        allVersionsUrl: "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/versions",
        averageRating: 5,
        downloadCount: 876926,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2025-03-11T03:23:21.877359Z",
        preview: false,
        displayName: "EditorConfig for VS Code",
        namespaceDisplayName: "EditorConfig",
        description: "EditorConfig Support for Visual Studio Code",
        engines: {
          vscode: "^1.90.0",
        },
        categories: [
          "Other",
        ],
        extensionKind: [
          "workspace",
        ],
        tags: [
          "__ext_editorconfig",
          "config",
          "editor",
          "editorconfig",
          "multi-root ready",
        ],
        license: "MIT",
        homepage: "https://github.com/editorconfig/editorconfig-vscode/blob/main/README.md",
        repository: "https://github.com/editorconfig/editorconfig-vscode.git",
        sponsorLink: "",
        bugs: "https://github.com/editorconfig/editorconfig-vscode/issues",
        galleryColor: "#37699A",
        galleryTheme: "dark",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/EditorConfig/EditorConfig/universal/0.17.2",
        deprecated: false,
        downloadable: true,
        model: {
          packagePath: "/Users/jaylen/.theia/deployedPlugins/editorconfig.editorconfig-0.17.2/extension",
          packageUri: "file:///Users/jaylen/.theia/deployedPlugins/editorconfig.editorconfig-0.17.2/extension",
          id: "editorconfig.editorconfig",
          name: "EditorConfig",
          publisher: "EditorConfig",
          version: "0.17.2",
          displayName: "EditorConfig for VS Code",
          description: "EditorConfig Support for Visual Studio Code",
          engine: {
            type: "vscode",
            version: "^1.90.0",
          },
          entryPoint: {
            backend: "/Users/jaylen/.theia/deployedPlugins/editorconfig.editorconfig-0.17.2/extension/out/editorConfigMain.js",
          },
          iconUrl: "hostedPlugin/EditorConfig_EditorConfig/EditorConfig_icon.png",
          readmeUrl: "hostedPlugin/EditorConfig_EditorConfig/.%2FREADME.md",
          licenseUrl: "hostedPlugin/EditorConfig_EditorConfig/.%2FLICENSE",
        },
        id: "editorconfig.editorconfig",
        publisher: "EditorConfig",
        downloadUrl: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/EditorConfig.EditorConfig-0.17.2.vsix",
        iconUrl: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/EditorConfig_icon.png",
        readmeUrl: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/readme.md",
        licenseUrl: "https://open-vsx.org/api/EditorConfig/EditorConfig/0.17.2/file/LICENSE.md",
      },
      {
        namespaceUrl: "https://open-vsx.org/api/Vue",
        reviewsUrl: "https://open-vsx.org/api/Vue/volar/reviews",
        files: {
          download: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/Vue.volar-3.0.0-alpha.0.vsix",
          signature: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/Vue.volar-3.0.0-alpha.0.sigzip",
          manifest: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/package.json",
          readme: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/readme.md",
          changelog: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/changelog.md",
          license: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/LICENSE.txt",
          icon: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/icon.png",
          vsixmanifest: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/extension.vsixmanifest",
          sha256: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/Vue.volar-3.0.0-alpha.0.sha256",
          publicKey: "https://open-vsx.org/api/-/public-key/14ccb407-4e79-41ed-be5a-6d608325c45a",
        },
        name: "volar",
        namespace: "Vue",
        targetPlatform: "universal",
        version: "3.0.0-alpha.0",
        preRelease: false,
        publishedBy: {
          loginName: "lukashass",
          fullName: "Lukas",
          avatarUrl: "https://avatars.githubusercontent.com/u/32853499?v=4",
          homepage: "https://github.com/lukashass",
          provider: "github",
        },
        verified: false,
        unrelatedPublisher: true,
        namespaceAccess: "restricted",
        allVersions: {
          "latest": "https://open-vsx.org/api/Vue/volar/universal/latest",
          "3.0.0-alpha.0": "https://open-vsx.org/api/Vue/volar/universal/3.0.0-alpha.0",
          "3.0.0-alpha.2": "https://open-vsx.org/api/Vue/volar/universal/3.0.0-alpha.2",
          "2.2.8": "https://open-vsx.org/api/Vue/volar/universal/2.2.8",
          "2.2.6": "https://open-vsx.org/api/Vue/volar/universal/2.2.6",
          "2.2.4": "https://open-vsx.org/api/Vue/volar/universal/2.2.4",
          "2.2.2": "https://open-vsx.org/api/Vue/volar/universal/2.2.2",
          "2.2.0": "https://open-vsx.org/api/Vue/volar/universal/2.2.0",
          "2.1.10": "https://open-vsx.org/api/Vue/volar/universal/2.1.10",
          "2.1.8": "https://open-vsx.org/api/Vue/volar/universal/2.1.8",
          "2.1.6": "https://open-vsx.org/api/Vue/volar/universal/2.1.6",
          "2.1.4": "https://open-vsx.org/api/Vue/volar/universal/2.1.4",
          "2.1.2": "https://open-vsx.org/api/Vue/volar/universal/2.1.2",
          "2.1.0": "https://open-vsx.org/api/Vue/volar/universal/2.1.0",
          "2.0.28": "https://open-vsx.org/api/Vue/volar/universal/2.0.28",
          "2.0.26": "https://open-vsx.org/api/Vue/volar/universal/2.0.26",
          "2.0.26-alpha.1": "https://open-vsx.org/api/Vue/volar/universal/2.0.26-alpha.1",
          "2.0.26-alpha.2": "https://open-vsx.org/api/Vue/volar/universal/2.0.26-alpha.2",
          "2.0.24": "https://open-vsx.org/api/Vue/volar/universal/2.0.24",
          "2.0.23-alpha.0": "https://open-vsx.org/api/Vue/volar/universal/2.0.23-alpha.0",
          "2.0.23-alpha.1": "https://open-vsx.org/api/Vue/volar/universal/2.0.23-alpha.1",
          "2.0.21": "https://open-vsx.org/api/Vue/volar/universal/2.0.21",
          "2.0.20": "https://open-vsx.org/api/Vue/volar/universal/2.0.20",
          "2.0.17": "https://open-vsx.org/api/Vue/volar/universal/2.0.17",
          "2.0.16": "https://open-vsx.org/api/Vue/volar/universal/2.0.16",
          "2.0.15": "https://open-vsx.org/api/Vue/volar/universal/2.0.15",
          "2.0.13": "https://open-vsx.org/api/Vue/volar/universal/2.0.13",
          "2.0.12": "https://open-vsx.org/api/Vue/volar/universal/2.0.12",
          "2.0.11": "https://open-vsx.org/api/Vue/volar/universal/2.0.11",
          "2.0.10": "https://open-vsx.org/api/Vue/volar/universal/2.0.10",
          "2.0.7": "https://open-vsx.org/api/Vue/volar/universal/2.0.7",
          "2.0.6": "https://open-vsx.org/api/Vue/volar/universal/2.0.6",
          "2.0.5": "https://open-vsx.org/api/Vue/volar/universal/2.0.5",
          "2.0.3": "https://open-vsx.org/api/Vue/volar/universal/2.0.3",
          "2.0.2": "https://open-vsx.org/api/Vue/volar/universal/2.0.2",
          "2.0.1": "https://open-vsx.org/api/Vue/volar/universal/2.0.1",
          "2.0.0": "https://open-vsx.org/api/Vue/volar/universal/2.0.0",
          "1.8.27": "https://open-vsx.org/api/Vue/volar/universal/1.8.27",
          "1.8.26": "https://open-vsx.org/api/Vue/volar/universal/1.8.26",
          "1.8.25": "https://open-vsx.org/api/Vue/volar/universal/1.8.25",
          "1.8.24": "https://open-vsx.org/api/Vue/volar/universal/1.8.24",
          "1.8.22": "https://open-vsx.org/api/Vue/volar/universal/1.8.22",
          "1.8.21": "https://open-vsx.org/api/Vue/volar/universal/1.8.21",
          "1.8.20": "https://open-vsx.org/api/Vue/volar/universal/1.8.20",
          "1.8.19": "https://open-vsx.org/api/Vue/volar/universal/1.8.19",
          "1.8.18": "https://open-vsx.org/api/Vue/volar/universal/1.8.18",
          "1.8.17": "https://open-vsx.org/api/Vue/volar/universal/1.8.17",
          "1.8.16": "https://open-vsx.org/api/Vue/volar/universal/1.8.16",
          "1.8.15": "https://open-vsx.org/api/Vue/volar/universal/1.8.15",
          "1.8.14": "https://open-vsx.org/api/Vue/volar/universal/1.8.14",
          "1.8.13": "https://open-vsx.org/api/Vue/volar/universal/1.8.13",
          "1.8.12": "https://open-vsx.org/api/Vue/volar/universal/1.8.12",
          "1.8.11": "https://open-vsx.org/api/Vue/volar/universal/1.8.11",
          "1.8.10": "https://open-vsx.org/api/Vue/volar/universal/1.8.10",
          "1.8.8": "https://open-vsx.org/api/Vue/volar/universal/1.8.8",
          "1.8.7": "https://open-vsx.org/api/Vue/volar/universal/1.8.7",
          "1.8.6": "https://open-vsx.org/api/Vue/volar/universal/1.8.6",
          "1.8.4": "https://open-vsx.org/api/Vue/volar/universal/1.8.4",
          "1.8.3": "https://open-vsx.org/api/Vue/volar/universal/1.8.3",
          "1.8.2": "https://open-vsx.org/api/Vue/volar/universal/1.8.2",
          "1.8.1": "https://open-vsx.org/api/Vue/volar/universal/1.8.1",
          "1.8.0": "https://open-vsx.org/api/Vue/volar/universal/1.8.0",
          "1.7.14": "https://open-vsx.org/api/Vue/volar/universal/1.7.14",
          "1.7.13": "https://open-vsx.org/api/Vue/volar/universal/1.7.13",
          "1.7.12": "https://open-vsx.org/api/Vue/volar/universal/1.7.12",
          "1.7.11": "https://open-vsx.org/api/Vue/volar/universal/1.7.11",
          "1.7.10": "https://open-vsx.org/api/Vue/volar/universal/1.7.10",
          "1.7.9": "https://open-vsx.org/api/Vue/volar/universal/1.7.9",
          "1.7.8": "https://open-vsx.org/api/Vue/volar/universal/1.7.8",
          "1.7.7": "https://open-vsx.org/api/Vue/volar/universal/1.7.7",
          "1.7.6": "https://open-vsx.org/api/Vue/volar/universal/1.7.6",
          "1.7.5": "https://open-vsx.org/api/Vue/volar/universal/1.7.5",
          "1.7.4": "https://open-vsx.org/api/Vue/volar/universal/1.7.4",
          "1.7.3": "https://open-vsx.org/api/Vue/volar/universal/1.7.3",
          "1.7.1": "https://open-vsx.org/api/Vue/volar/universal/1.7.1",
          "1.7.0": "https://open-vsx.org/api/Vue/volar/universal/1.7.0",
          "1.6.5": "https://open-vsx.org/api/Vue/volar/universal/1.6.5",
          "1.6.4": "https://open-vsx.org/api/Vue/volar/universal/1.6.4",
          "1.6.3": "https://open-vsx.org/api/Vue/volar/universal/1.6.3",
          "1.6.2": "https://open-vsx.org/api/Vue/volar/universal/1.6.2",
          "1.6.1": "https://open-vsx.org/api/Vue/volar/universal/1.6.1",
          "1.6.0": "https://open-vsx.org/api/Vue/volar/universal/1.6.0",
          "1.5.4": "https://open-vsx.org/api/Vue/volar/universal/1.5.4",
          "1.5.3": "https://open-vsx.org/api/Vue/volar/universal/1.5.3",
          "1.5.2": "https://open-vsx.org/api/Vue/volar/universal/1.5.2",
          "1.5.1": "https://open-vsx.org/api/Vue/volar/universal/1.5.1",
          "1.5.0": "https://open-vsx.org/api/Vue/volar/universal/1.5.0",
          "1.4.4": "https://open-vsx.org/api/Vue/volar/universal/1.4.4",
          "1.4.3": "https://open-vsx.org/api/Vue/volar/universal/1.4.3",
          "1.4.2": "https://open-vsx.org/api/Vue/volar/universal/1.4.2",
          "1.4.1": "https://open-vsx.org/api/Vue/volar/universal/1.4.1",
          "1.3.14": "https://open-vsx.org/api/Vue/volar/universal/1.3.14",
          "1.3.13": "https://open-vsx.org/api/Vue/volar/universal/1.3.13",
          "1.3.11": "https://open-vsx.org/api/Vue/volar/universal/1.3.11",
          "1.3.10": "https://open-vsx.org/api/Vue/volar/universal/1.3.10",
          "1.3.8": "https://open-vsx.org/api/Vue/volar/universal/1.3.8",
          "1.3.7": "https://open-vsx.org/api/Vue/volar/universal/1.3.7",
          "1.3.6": "https://open-vsx.org/api/Vue/volar/universal/1.3.6",
          "1.3.5": "https://open-vsx.org/api/Vue/volar/universal/1.3.5",
          "1.3.4": "https://open-vsx.org/api/Vue/volar/universal/1.3.4",
          "1.2.0": "https://open-vsx.org/api/Vue/volar/universal/1.2.0",
        },
        allVersionsUrl: "https://open-vsx.org/api/Vue/volar/universal/versions",
        averageRating: 5,
        downloadCount: 626774,
        reviewCount: 1,
        versionAlias: [
          "latest",
        ],
        timestamp: "2025-03-07T21:33:46.658422Z",
        preview: false,
        displayName: "Vue - Official",
        namespaceDisplayName: "Vue",
        description: "Language Support for Vue",
        engines: {
          vscode: "^1.88.0",
        },
        categories: [
          "Programming Languages",
        ],
        extensionKind: [
          "workspace",
          "web",
        ],
        tags: [
          "__ext_vue",
          "__sponsor_extension",
          "__web_extension",
          "html",
          "jade",
          "json",
          "markdown",
          "plaintext",
          "vue",
        ],
        homepage: "https://github.com/vuejs/language-tools#readme",
        repository: "https://github.com/vuejs/language-tools.git",
        sponsorLink: "https://github.com/sponsors/johnsoncodehk",
        bugs: "https://github.com/vuejs/language-tools/issues",
        galleryColor: "",
        galleryTheme: "",
        localizedLanguages: [],
        dependencies: [],
        bundledExtensions: [],
        url: "https://open-vsx.org/api/Vue/volar/universal/3.0.0-alpha.0",
        deprecated: false,
        downloadable: true,
        model: {
          packagePath: "/Users/jaylen/.theia/deployedPlugins/vue.volar-3.0.0-alpha.0/extension",
          packageUri: "file:///Users/jaylen/.theia/deployedPlugins/vue.volar-3.0.0-alpha.0/extension",
          id: "vue.volar",
          name: "volar",
          publisher: "Vue",
          version: "3.0.0-alpha.0",
          displayName: "Vue - Official",
          description: "Language Support for Vue",
          engine: {
            type: "vscode",
            version: "^1.88.0",
          },
          entryPoint: {
            backend: "/Users/jaylen/.theia/deployedPlugins/vue.volar-3.0.0-alpha.0/extension/client.js",
          },
          iconUrl: "hostedPlugin/Vue_volar/images%2Ficon.png",
          readmeUrl: "hostedPlugin/Vue_volar/.%2FREADME.md",
          licenseUrl: "hostedPlugin/Vue_volar/.%2FLICENSE",
        },
        id: "vue.volar",
        publisher: "Vue",
        downloadUrl: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/Vue.volar-3.0.0-alpha.0.vsix",
        iconUrl: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/icon.png",
        readmeUrl: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/readme.md",
        licenseUrl: "https://open-vsx.org/api/Vue/volar/3.0.0-alpha.0/file/LICENSE.txt",
      },
    ].filter(data => !!data.model);

    const prevInstalled = this._installed;
    return this.doChange(async () => {
      // const plugins = this.pluginClient.plugins;
      const currInstalled = new Set<string>();
      const refreshing = [];

      for (const plugin of mockDatas) {
        const id = plugin.id ?? plugin.model?.id;
        const extension = this.setExtension(id);
        currInstalled.add(extension.id);
        refreshing.push(this.refresh(plugin));
      }

      const installed = new Set([...prevInstalled, ...currInstalled]);
      const installedSorted = Array.from(installed).sort((a, b) => this.compareExtensions(a, b));

      this._installed = new Set(installedSorted.values());
      await Promise.all(refreshing);
    });
  }

  resolve(id: string): Promise<IPlugin> {
    const readmes = [
      '/Users/jaylen/.theia/deployedPlugins/dbaeumer.vscode-eslint-3.0.10/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/dracula-theme.theme-dracula-2.25.1/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/editorconfig.editorconfig-0.17.2/extension/readme.md',
      '/Users/jaylen/.theia/deployedPlugins/ms-vscode.vscode-github-issue-notebooks-0.0.130/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/sample-namespace.plugin-a-1.53.0/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/sample-namespace.plugin-b-1.53.0/extension/README.md',
      '/Users/jaylen/.theia/deployedPlugins/vue.volar-3.0.0-alpha.0/extension/readme.md',
    ];
    return this.doChange(async () => {
      await this.initialized;
      const extension = await this.refresh({ id }) ?? this.getExtension(id);
      if (!extension) {
        throw new Error(`Failed to resolve ${id} extension.`);
      }
      if (extension.readme === undefined) {
        try {
          const [_, { content: readme }] = await messagingService.get<any>(`http://localhost:8080/api/file${readmes.find(r => r.includes(id))}`);
          extension.update({ readme: this.compileReadme(readme) });
        }
        catch (e) {
          console.error((e as Error).stack);
        }
      }
      return extension;
    });
  }

  protected async refresh(data: any): Promise<IPlugin | undefined> {
    let extension = this.getExtension(data.id);
    if (!this.shouldRefresh(extension)) {
      return extension;
    }
    extension = this.setExtension(data.id);
    extension.update(data);
    return extension;
  }

  protected doChange<T>(task: () => Promise<T>): Promise<T>;
  protected doChange<T>(task: () => Promise<T>, token: CancellationToken): Promise<T | undefined>;
  protected doChange<T>(task: () => Promise<T>, token: CancellationToken = CancellationToken.None): Promise<T | undefined> {
    const taskWrapper = async () => {
      if (token && token.isCancellationRequested) {
        return;
      }
      const result = await task();
      if (token && token.isCancellationRequested) {
        return;
      }
      this.onDidChangeEmitter.fire();
      return result;
    };

    return taskWrapper();
  }

  /**
   * Compare two extensions based on their display name, and publisher if applicable.
   * @param a the first extension id for comparison.
   * @param b the second extension id for comparison.
   */
  protected compareExtensions(a: string, b: string): number {
    const extensionA = this.getExtension(a);
    const extensionB = this.getExtension(b);
    if (!extensionA || !extensionB) {
      return 0;
    }
    if (extensionA.displayName && extensionB.displayName) {
      return extensionA.displayName.localeCompare(extensionB.displayName);
    }
    if (extensionA.publisher && extensionB.publisher) {
      return extensionA.publisher.localeCompare(extensionB.publisher);
    }
    return 0;
  }

  protected onDidFailRefresh(id: string, error: unknown): IPlugin | undefined {
    const cached = this.getExtension(id);
    if (cached && cached.installed) {
      return cached;
    }
    console.error(`[${id}]: failed to refresh, reason:`, error);
    return undefined;
  }

  setOnlyShowVerifiedExtensions(_bool: boolean): void {
    this.updateSearchResult();
  }

  protected updateSearchResult = pDebounce(async () => {
    const { token } = this.resetSearchCancellationTokenSource();
    await this.doUpdateSearchResult({ query: this.search.query, includeAllVersions: true }, token);
  }, 500);

  protected resetSearchCancellationTokenSource(): CancellationTokenSource {
    this.searchCancellationTokenSource.cancel();
    return this.searchCancellationTokenSource = new CancellationTokenSource();
  }

  protected doUpdateSearchResult(_param: any, _token: CancellationToken): Promise<void> {
    return Promise.resolve();
  }

  protected compileReadme(readmeMarkdown: string): string {
    const readmeHtml = markdownit({ html: true }).render(readmeMarkdown);
    return DOMPurify.sanitize(readmeHtml);
  }

  /**
   * Determines if the given extension should be refreshed.
   * @param extension the extension to refresh.
   */
  protected shouldRefresh(extension?: any): boolean {
    if (extension === undefined) {
      return true;
    }
    return !extension.builtin;
  }
}

export const IPluginsModel = createServiceDecorator<IPluginsModel>(PluginsModel.name);
export type IPluginsModel = PluginsModel;
