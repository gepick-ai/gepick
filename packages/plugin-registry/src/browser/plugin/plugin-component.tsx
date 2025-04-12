import { React, TreeElementNode, TreeWidget, codicon } from "@gepick/core/browser";
import { InjectableService, MarkdownStringImpl } from "@gepick/core/common";

const downloadCompactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' } as any);
const averageRatingFormatter = (averageRating: number): number => Math.round(averageRating * 2) / 2;

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

export class Plugin {}

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
