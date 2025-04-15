import { DOMPurify, IWidgetFactory, Message, React, ReactWidget, Widget, codicon } from "@gepick/core/browser";
import { Contribution, Deferred, IServiceContainer, InjectableService, PostConstruct, URI, createServiceDecorator } from "@gepick/core/common";
import { AbstractVSXExtensionComponent, IPlugin, IPluginOptions, Plugin, PluginOptions } from "../plugin/plugin-component";
import { IPluginsModel } from "../plugin/plugin-model";

const downloadFormatter = new Intl.NumberFormat();
const averageRatingFormatter = (averageRating: number): number => Math.round(averageRating * 2) / 2;
const getAverageRatingTitle = (averageRating: number): string => `Average rating: ${averageRatingFormatter(averageRating)} out of 5`;

class PluginEditorComponent extends AbstractVSXExtensionComponent {
  protected header: HTMLElement | undefined;
  protected body: HTMLElement | undefined;
  protected _scrollContainer: HTMLElement | undefined;

  get scrollContainer(): HTMLElement | undefined {
    return this._scrollContainer;
  }

  override render(): React.ReactNode {
    const {
      builtin,
      preview,
      id,
      iconUrl,
      publisher,
      displayName,
      description,
      averageRating,
      downloadCount,
      repository,
      license,
      readme,
    } = this.props.extension;

    const sanitizedReadme = readme ? DOMPurify.sanitize(readme) : undefined;

    return (
      <React.Fragment>
        <div className="header" ref={ref => this.header = (ref || undefined)}>
          {iconUrl
            ? <img className="icon-container" src={iconUrl} />
            : <div className="icon-container placeholder" />}
          <div className="details">
            <div className="title">
              <span title="Extension name" className="name" onClick={this.openExtension}>{displayName}</span>
              <span title="Extension identifier" className="identifier">{id}</span>
              {preview && <span className="preview">Preview</span>}
              {builtin && <span className="builtin">Built-in</span>}
            </div>
            <div className="subtitle">
              <span title="Publisher name" className="publisher" onClick={this.searchPublisher}>
                {this.renderNamespaceAccess()}
                {publisher}
              </span>
              {!!downloadCount && (
                <span className="download-count" onClick={this.openExtension}>
                  <i className={codicon('cloud-download')} />
                  {downloadFormatter.format(downloadCount)}
                </span>
              )}
              {
                averageRating !== undefined
                && <span className="average-rating" title={getAverageRatingTitle(averageRating)} onClick={this.openAverageRating}>{this.renderStars()}</span>
              }
              {repository && <span className="repository" onClick={this.openRepository}>Repository</span>}
              {license && <span className="license" onClick={this.openLicense}>{license}</span>}
              {/* {version && <span className="version">{VSXExtension.formatVersion(version)}</span>} */}
            </div>
            <div className="description noWrapInfo">{description}</div>
            {this.renderAction()}
          </div>
        </div>
        {
          sanitizedReadme
          && (
            <div
              className="scroll-container"
              ref={ref => this._scrollContainer = (ref || undefined)}
            >
              <div
                className="body"
                ref={ref => this.body = (ref || undefined)}
                onClick={this.openLink}
                dangerouslySetInnerHTML={{ __html: sanitizedReadme }}
              />
            </div>
          )
        }
      </React.Fragment>
    );
  }

  protected renderNamespaceAccess(): React.ReactNode {
    const { publisher, namespaceAccess, publishedBy } = this.props.extension;
    if (namespaceAccess === undefined) {
      return undefined;
    }
    let tooltip = publishedBy ? ` Published by "${publishedBy.loginName}".` : '';
    let icon;
    if (namespaceAccess === 'public') {
      icon = 'globe';
      tooltip = `Everyone can publish to "${publisher}" namespace.${tooltip}`;
    }
    else {
      icon = 'shield';
      tooltip = `Only verified owners can publish to "${publisher}" namespace.${tooltip}`;
    }
    return <i className={`${codicon(icon)} namespace-access`} title={tooltip} onClick={this.openPublishedBy} />;
  }

  protected renderStars(): React.ReactNode {
    const rating = this.props.extension.averageRating || 0;

    const renderStarAt = (position: number) => position <= rating
      ? <i className={codicon('star-full')} />
      : position > rating && position - rating < 1
        ? <i className={codicon('star-half')} />
        : <i className={codicon('star-empty')} />;
    return (
      <React.Fragment>
        {renderStarAt(1)}
        {renderStarAt(2)}
        {renderStarAt(3)}
        {renderStarAt(4)}
        {renderStarAt(5)}
      </React.Fragment>
    );
  }

  // TODO replace with webview
  readonly openLink = (event: React.MouseEvent) => {
    if (!this.body) {
      return;
    }
    const target = event.nativeEvent.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    let node = target;
    while (node.tagName.toLowerCase() !== 'a') {
      if (node === this.body) {
        return;
      }
      if (!(node.parentElement instanceof HTMLElement)) {
        return;
      }
      node = node.parentElement;
    }
    const href = node.getAttribute('href');
    if (href && !href.startsWith('#')) {
      event.preventDefault();
      this.props.extension.doOpen(new URI(href));
    }
  };

  readonly openExtension = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const extension = this.props.extension;
    const uri = await extension.getRegistryLink();
    extension.doOpen(uri);
  };

  readonly searchPublisher = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const extension = this.props.extension;
    if (extension.publisher) {
      extension.search.query = extension.publisher;
    }
  };

  readonly openPublishedBy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const extension = this.props.extension;
    const homepage = extension.publishedBy && extension.publishedBy.homepage;
    if (homepage) {
      extension.doOpen(new URI(homepage));
    }
  };

  readonly openAverageRating = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const extension = this.props.extension;
    const uri = await extension.getRegistryLink('reviews');
    extension.doOpen(uri);
  };

  readonly openRepository = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const extension = this.props.extension;
    if (extension.repository) {
      extension.doOpen(new URI(extension.repository));
    }
  };

  readonly openLicense = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const extension = this.props.extension;
    const licenseUrl = extension.licenseUrl;
    if (licenseUrl) {
      extension.doOpen(new URI(licenseUrl));
    }
  };
}

/**
 * 插件详情面板
 */
export class PluginEditorWidget extends ReactWidget {
  static ID = 'vsx-extension-editor';

  protected readonly deferredScrollContainer = new Deferred<HTMLElement>();

  constructor(
    @IPlugin protected readonly extension: IPlugin,
    @IPluginsModel protected readonly model: IPluginsModel,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.addClass('theia-vsx-extension-editor');
    this.id = `${PluginEditorWidget.ID}:${this.extension.id}`;
    this.title.closable = true;
    this.updateTitle();
    this.title.iconClass = codicon('list-selection');
    this.node.tabIndex = -1;
    this.update();
    this.toDispose.add(this.model.onDidChange(() => this.update()));
  }

  override getScrollContainer(): Promise<HTMLElement> {
    return this.deferredScrollContainer.promise;
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected override onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.updateTitle();
  }

  protected updateTitle(): void {
    const label = `Extension:${this.extension.name}`;
    this.title.label = label;
    this.title.caption = label;
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.update();
  };

  protected resolveScrollContainer = (element: PluginEditorComponent | null) => {
    if (!element) {
      this.deferredScrollContainer.reject(new Error('element is null'));
    }
    else if (!element.scrollContainer) {
      this.deferredScrollContainer.reject(new Error('element.scrollContainer is undefined'));
    }
    else {
      this.deferredScrollContainer.resolve(element.scrollContainer);
    }
  };

  protected render(): React.ReactNode {
    return (
      <PluginEditorComponent
        ref={this.resolveScrollContainer}
        extension={this.extension}
      />
    );
  }
}
export const IPluginEditorWidget = createServiceDecorator<IPluginEditorWidget>(PluginEditorWidget.name);
export type IPluginEditorWidget = PluginEditorWidget;

@Contribution(IWidgetFactory)
export class PluginEditorWidgetFactory extends InjectableService {
  public readonly id = PluginEditorWidget.ID;

  async createWidget(container: IServiceContainer, options: IPluginOptions) {
    container.rebind(PluginOptions.getServiceId()).toConstantValue(options);
    const extension = await container.get<IPluginsModel>(IPluginsModel).resolve(options.id);
    container.rebind(Plugin.getServiceId()).toConstantValue(extension);
    container.unbind(PluginEditorWidget.getServiceId());
    container.bind(PluginEditorWidget.getServiceId()).to(PluginEditorWidget);
    return container.get<IPluginEditorWidget>(IPluginEditorWidget);
  }
}
