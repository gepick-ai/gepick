import { Endpoint, IContextMenuRenderer, IHoverService, IOpenerService, OpenerOptions, React, TreeElement, TreeElementNode, TreeWidget, codicon, messagingService, open } from "@gepick/core/browser";
import { IServiceContainer, InjectableService, MarkdownStringImpl, MenuPath, PostConstruct, URI, createServiceDecorator } from "@gepick/core/common";
import { PluginType } from "@gepick/plugin-system/common";
import { IPluginRegistrySearchModel } from "../search/plugin-registry-search-model";
import { VSCodeExtensionUri } from "../vscode-util";

export const EXTENSIONS_CONTEXT_MENU: MenuPath = ['extensions_context_menu'];

const downloadCompactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' } as any);
const averageRatingFormatter = (averageRating: number): number => Math.round(averageRating * 2) / 2;
const getAverageRatingTitle = (averageRating: number): string => `'Average rating: ${averageRatingFormatter(averageRating)} out of 5'`;
export class PluginData extends InjectableService {
  readonly version?: string;
  readonly iconUrl?: string;
  readonly publisher?: string;
  readonly name?: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly averageRating?: number;
  readonly downloadCount?: number;
  readonly downloadUrl?: string;
  readonly readmeUrl?: string;
  readonly licenseUrl?: string;
  readonly repository?: string;
  readonly license?: string;
  readonly readme?: string;
  readonly preview?: boolean;
  readonly verified?: boolean;
  readonly namespaceAccess?: any;
  readonly publishedBy?: any;
  static KEYS: Set<(keyof PluginData)> = new Set([
    'version',
    'iconUrl',
    'publisher',
    'name',
    'displayName',
    'description',
    'averageRating',
    'downloadCount',
    'downloadUrl',
    'readmeUrl',
    'licenseUrl',
    'repository',
    'license',
    'readme',
    'preview',
    'verified',
    'namespaceAccess',
    'publishedBy',
  ]);
}

export class PluginOptions extends InjectableService {
  constructor(public readonly id: string) { super(); }
}
export const IPluginOptions = createServiceDecorator<IPluginOptions>(PluginOptions.name);
export type IPluginOptions = PluginOptions;

export abstract class AbstractVSXExtensionComponent<Props extends AbstractVSXExtensionComponent.Props = AbstractVSXExtensionComponent.Props> extends React.Component<Props> {
  readonly install = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    this.forceUpdate();
    try {
      const pending = this.props.extension.install();
      this.forceUpdate();
      await pending;
    }
    finally {
      this.forceUpdate();
    }
  };

  readonly uninstall = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const pending = this.props.extension.uninstall();
      this.forceUpdate();
      await pending;
    }
    finally {
      this.forceUpdate();
    }
  };

  readonly reloadWindow = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    this.props.extension.reloadWindow();
  };

  protected readonly manage = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation();
    this.props.extension.handleContextMenu(e);
  };

  protected renderAction(host?: TreeWidget): React.ReactNode {
    const { builtin, busy, plugin } = this.props.extension;
    const isFocused = (host?.model.getFocusedNode() as TreeElementNode)?.element === this.props.extension;
    const tabIndex = (!host || isFocused) ? 0 : undefined;
    const installed = !!plugin;
    const outOfSynch = plugin?.metadata.outOfSync;
    if (builtin) {
      return <div className="codicon codicon-settings-gear action" tabIndex={tabIndex} onClick={this.manage}></div>;
    }
    if (busy) {
      if (installed) {
        return <button className="theia-button action theia-mod-disabled">Uninstalling</button>;
      }
      return <button className="theia-button action prominent theia-mod-disabled">Installing</button>;
    }
    if (installed) {
      return (
        <div>
          {
            outOfSynch
              ? <button className="theia-button action" onClick={this.reloadWindow}>Reload Window</button>
              : <button className="theia-button action" onClick={this.uninstall}>Uninstall</button>
          }

          <div className="codicon codicon-settings-gear action" onClick={this.manage}></div>
        </div>
      );
    }
    return <button className="theia-button prominent action" onClick={this.install}>Install</button>;
  }
}
export namespace AbstractVSXExtensionComponent {
  export interface Props {
    extension: any;
  }
}

export namespace PluginComponent {
  export interface Props extends AbstractVSXExtensionComponent.Props {
    host: TreeWidget;
    hoverService: any;
  }
}

export class PluginComponent<Props extends PluginComponent.Props = PluginComponent.Props> extends AbstractVSXExtensionComponent<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      iconUrl: "",
    };
  }

  override async componentDidMount() {
    const url = this.props.extension.iconUrl;
    const [_, { content }] = await messagingService.get(`http://localhost:8080/api/file${url}`) as any;
    this.setState({ iconUrl: content });
  }

  override render(): React.ReactNode {
    const { publisher, displayName, description, version, downloadCount, averageRating, tooltip, verified } = this.props.extension;
    const { iconUrl } = this.state as { iconUrl: string };

    return (
      <div
        className="theia-vsx-extension noselect"
        onMouseEnter={(event) => {
          this.props.hoverService.requestHover({
            content: new MarkdownStringImpl(tooltip),
            target: event.currentTarget,
            position: 'right',
          });
        }}
        onMouseUp={(event) => {
          if (event.button === 2) {
            this.manage(event);
          }
        }}
      >
        {iconUrl
          ? <img className="theia-vsx-extension-icon" src={iconUrl} />
          : <div className="theia-vsx-extension-icon placeholder" />}
        <div className="theia-vsx-extension-content">
          <div className="title">
            <div className="noWrapInfo">
              <span className="name">{displayName}</span>
              {' '}
              <span className="version">{version}</span>
            </div>
            <div className="stat">
              {!!downloadCount && (
                <span className="download-count">
                  <i className={codicon('cloud-download')} />
                  {downloadCompactFormatter.format(downloadCount)}
                </span>
              )}
              {!!averageRating && (
                <span className="average-rating">
                  <i className={codicon('star-full')} />
                  {averageRatingFormatter(averageRating)}
                </span>
              )}
            </div>
          </div>
          <div className="noWrapInfo theia-vsx-extension-description">{description}</div>
          <div className="theia-vsx-extension-action-bar">
            <div className="theia-vsx-extension-publisher-container">
              {verified === true
                ? (
                    <i className={codicon('verified-filled')} />
                  )
                : verified === false
                  ? (
                      <i className={codicon('verified')} />
                    )
                  : (
                      <i className={codicon('question')} />
                    )}
              <span className="noWrapInfo theia-vsx-extension-publisher">{publisher}</span>
            </div>
            {this.renderAction(this.props.host)}
          </div>
        </div>
      </div>
    );
  }
}

export class Plugin extends InjectableService implements PluginData, TreeElement {
  protected readonly data: Partial<PluginData> = {};

  protected registryUri: Promise<string>;

  /**
   * Ensure the version string begins with `'v'`.
   */
  static formatVersion(version: string | undefined): string | undefined {
    if (version && !version.startsWith('v')) {
      return `v${version}`;
    }
    return version;
  }

  constructor(
    @IPluginOptions protected readonly options: IPluginOptions,
    @IPluginRegistrySearchModel readonly search: IPluginRegistrySearchModel,
    @IContextMenuRenderer protected readonly contextMenuRenderer: IContextMenuRenderer,
    @IHoverService protected readonly hoverService: IHoverService,
    @IOpenerService protected readonly openerService: IOpenerService,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.registryUri = new Promise(resolve => resolve(""));
  }

  get uri(): URI {
    return VSCodeExtensionUri.fromId(this.id);
  }

  get id(): string {
    return this.options.id;
  }

  get name(): string | undefined {
    return this.getData('name');
  }

  get displayName(): string | undefined {
    return this.getData('displayName') || this.name;
  }

  get visible(): boolean {
    return !!this.name;
  }

  get plugin(): any | undefined {
    return this.options;
  }

  get installed(): boolean {
    return !!this.plugin;
  }

  get builtin(): boolean {
    return this.plugin?.type === PluginType.System;
  }

  get iconUrl(): string | undefined {
    const plugin = this.plugin;
    // const iconUrl = plugin && plugin.metadata.model.iconUrl;
    // if (iconUrl) {
    //   return new Endpoint({ path: iconUrl }).getRestUrl().toString();
    // }
    // return this.data.iconUrl;

    const icons = [
      {
        id: "dbaeumer.vscode-eslint",
        url: '/Users/jaylen/.theia/deployedPlugins/dbaeumer.vscode-eslint-3.0.10/extension/eslint_icon.png',
      },
      {
        id: "dracula-theme.theme-dracula",
        url: '/Users/jaylen/.theia/deployedPlugins/dracula-theme.theme-dracula-2.25.1/extension/icon.png',
      },
      {
        id: "editorconfig.editorconfig",
        url: '/Users/jaylen/.theia/deployedPlugins/editorconfig.editorconfig-0.17.2/extension/EditorConfig_icon.png',
      },
      {
        id: "ms-vscode.vscode-github-issue-notebooks",
        url: '/Users/jaylen/.theia/deployedPlugins/ms-vscode.vscode-github-issue-notebooks-0.0.130/extension/icon.png',
      },
      {
        id: "sample-namespace.plugin-a",
        url: '/Users/jaylen/.theia/deployedPlugins/sample-namespace.plugin-a-1.53.0/extension/icon128.png',
      },
      {
        id: "vue.volar",
        url: '/Users/jaylen/.theia/deployedPlugins/vue.volar-3.0.0-alpha.0/extension/images/icon.png',
      },
    ];

    const icon = icons.find((icon) => {
      if (plugin.metadata.model.id.includes(icon.id)) {
        return icon.url;
      }
      return undefined;
    });

    return icon?.url;
  }

  get publisher(): string | undefined {
    return this.getData('publisher');
  }

  get description(): string | undefined {
    return this.getData('description');
  }

  get version(): string | undefined {
    return this.getData('version');
  }

  get averageRating(): number | undefined {
    return this.getData('averageRating');
  }

  get downloadCount(): number | undefined {
    return this.getData('downloadCount');
  }

  get downloadUrl(): string | undefined {
    return this.getData('downloadUrl');
  }

  get readmeUrl(): string | undefined {
    const plugin = this.plugin;
    const readmeUrl = plugin && plugin.metadata.model.readmeUrl;
    if (readmeUrl) {
      return new Endpoint({ path: readmeUrl }).getRestUrl().toString();
    }
    return this.data.readmeUrl;
  }

  get licenseUrl(): string | undefined {
    let licenseUrl = this.data.licenseUrl;
    if (licenseUrl) {
      return licenseUrl;
    }
    else {
      const plugin = this.plugin;
      licenseUrl = plugin && plugin.metadata.model.licenseUrl;
      if (licenseUrl) {
        return new Endpoint({ path: licenseUrl }).getRestUrl().toString();
      }
    }

    return undefined;
  }

  get repository(): string | undefined {
    return this.getData('repository');
  }

  get license(): string | undefined {
    return this.getData('license');
  }

  get readme(): string | undefined {
    return this.getData('readme');
  }

  get preview(): boolean | undefined {
    return this.getData('preview');
  }

  get verified(): boolean | undefined {
    return this.getData('verified');
  }

  get namespaceAccess(): any {
    return this.getData('namespaceAccess');
  }

  get publishedBy(): any | undefined {
    return this.getData('publishedBy');
  }

  get tooltip(): string {
    let md = `__${this.displayName}__ ${Plugin.formatVersion(this.version)}\n\n${this.description}\n_____\n\n${`Publisher: ${this.publisher}`}`;

    if (this.license) {
      md += `  \r${`License: ${this.license}`}`;
    }

    if (this.downloadCount) {
      md += `  \r${`Download count: ${downloadCompactFormatter.format(this.downloadCount)}`}`;
    }

    if (this.averageRating) {
      md += `  \r${getAverageRatingTitle(this.averageRating)}`;
    }

    return md;
  }

  protected _busy = 0;
  get busy(): boolean {
    return !!this._busy;
  }

  protected getData<K extends keyof PluginData>(key: K): PluginData[K] {
    const model = this.plugin?.metadata.model;
    if (model && key in model) {
      return model[key as keyof typeof model] as PluginData[K];
    }
    return this.data[key];
  }

  update(data: Partial<PluginData>): void {
    for (const key of PluginData.KEYS) {
      if (key in data) {
        Object.assign(this.data, { [key]: data[key] });
      }
    }
  }

  reloadWindow(): void {
    window.location.reload();
  }

  handleContextMenu(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
    e.preventDefault();
    this.contextMenuRenderer.render({
      menuPath: EXTENSIONS_CONTEXT_MENU,
      anchor: {
        x: e.clientX,
        y: e.clientY,
      },
      args: [this],
      context: e.currentTarget,
    });
  }

  /**
   * Get the registry link for the given extension.
   * @param path the url path.
   * @returns the registry link for the given extension at the path.
   */
  async getRegistryLink(path = ''): Promise<URI> {
    const registryUri = new URI(await this.registryUri);
    if (this.downloadUrl) {
      const downloadUri = new URI(this.downloadUrl);
      if (downloadUri.authority !== registryUri.authority) {
        throw new Error('cannot generate a valid URL');
      }
    }
    return registryUri.resolve(`extension/${this.id.replace('.', '/')}`).resolve(path);
  }

  async serialize(): Promise<string> {
    const serializedExtension: string[] = [];
    serializedExtension.push(`Name: ${this.displayName}`);
    serializedExtension.push(`Id: ${this.id}`);
    serializedExtension.push(`Description: ${this.description}`);
    serializedExtension.push(`Version: ${this.version}`);
    serializedExtension.push(`Publisher: ${this.publisher}`);
    if (this.downloadUrl !== undefined) {
      const registryLink = await this.getRegistryLink();
      serializedExtension.push(`Open VSX Link: ${registryLink.toString()}`);
    };
    return serializedExtension.join('\n');
  }

  async open(options: OpenerOptions = { mode: 'reveal' }): Promise<void> {
    await this.doOpen(this.uri, options);
  }

  async doOpen(uri: URI, options?: OpenerOptions): Promise<void> {
    await open(this.openerService, uri, options);
  }

  render(host: TreeWidget): React.ReactNode {
    return <PluginComponent extension={this} host={host} hoverService={this.hoverService} />;
  }
}
export const IPlugin = createServiceDecorator<IPlugin>(Plugin.name);
export type IPlugin = Plugin;

export class PluginFactory extends InjectableService {
  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createPlugin(options: IPluginOptions): Plugin {
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

    if (this.serviceContainer.isBound(PluginOptions.getServiceId())) {
      this.serviceContainer.rebind(PluginOptions.getServiceId()).toConstantValue(Object.assign(options, { metadata: mockDatas.find(data => options.id === data.id) }));
    }
    else {
      this.serviceContainer.bind(PluginOptions.getServiceId()).toConstantValue(Object.assign(options, { metadata: mockDatas.find(data => options.id === data.id) }));
    }

    this.serviceContainer.rebind(Plugin.getServiceId()).to(Plugin).inRequestScope();

    return this.serviceContainer.get<IPlugin>(IPlugin);
  }
}
export const IPluginFactory = createServiceDecorator<IPluginFactory>(PluginFactory.name);
export type IPluginFactory = PluginFactory;
