import { Endpoint, IContextMenuRenderer, IHoverService, IOpenerService, OpenerOptions, React, TreeElement, TreeElementNode, TreeWidget, codicon, open } from "@gepick/core/browser";
import { InjectableService, MarkdownStringImpl, MenuPath, PostConstruct, URI, createServiceDecorator } from "@gepick/core/common";
import { PluginType } from "@gepick/plugin-system/common";
import { IPluginRegistrySearchModel } from "../search/plugin-registry-search-model";

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
  readonly id: string;
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
  override render(): React.ReactNode {
    const { iconUrl, publisher, displayName, description, version, downloadCount, averageRating, tooltip, verified } = this.props.extension;

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
    return new URI('');
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
    return {};
  }

  get installed(): boolean {
    return !!this.plugin;
  }

  get builtin(): boolean {
    return this.plugin?.type === PluginType.System;
  }

  get iconUrl(): string | undefined {
    const plugin = this.plugin;
    const iconUrl = plugin && plugin.metadata.model.iconUrl;
    if (iconUrl) {
      return new Endpoint({ path: iconUrl }).getRestUrl().toString();
    }
    return this.data.iconUrl;
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
