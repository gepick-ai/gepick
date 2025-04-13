import { Message, ReactWidget, codicon } from "@gepick/core/browser";
import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPluginRegistrySearchModel } from "./plugin-registry-search-model";

export class PluginRegistrySearchBar extends ReactWidget {
  protected input: HTMLInputElement | undefined;
  protected onlyShowVerifiedExtensions: boolean | undefined;

  @IPluginRegistrySearchModel protected readonly searchModel: IPluginRegistrySearchModel;

  @PostConstruct()
  protected init(): void {
    this.onlyShowVerifiedExtensions = false;
    this.id = 'vsx-extensions-search-bar';
    this.addClass('theia-vsx-extensions-search-bar');

    this.searchModel.onDidChangeQuery((query: string) => this.updateSearchTerm(query));
  }

  protected render(): React.ReactNode {
    return (
      <div className="vsx-search-container">
        <input
          type="text"
          ref={input => this.input = input || undefined}
          defaultValue=""
          spellCheck={false}
          className="theia-input"
          placeholder="Search Extensions in Plugin Registry"
          onChange={this.updateQuery}
        >
        </input>
        {this.renderOptionContainer()}
      </div>
    );
  }

  protected updateQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.searchModel.query = e.target.value;
  };

  protected updateSearchTerm(term: string): void {
    if (this.input) {
      this.input.value = term;
    }
  }

  protected renderOptionContainer(): React.ReactNode {
    const showVerifiedExtensions = this.renderShowVerifiedExtensions();
    return <div className="option-buttons">{showVerifiedExtensions}</div>;
  }

  protected renderShowVerifiedExtensions(): React.ReactNode {
    return (
      <span
        className={`${codicon('verified')} option action-label ${this.onlyShowVerifiedExtensions ? 'enabled' : ''}`}
        title="Only Show Verified Extensions"
        onClick={() => this.handleShowVerifiedExtensionsClick()}
      >
      </span>
    );
  }

  protected handleShowVerifiedExtensionsClick(): void {
    this.update();
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    if (this.input) {
      this.input.focus();
    }
  }

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.update();
  }
}

export const IPluginRegistrySearchBar = createServiceDecorator<IPluginRegistrySearchBar>(PluginRegistrySearchBar.name);
export type IPluginRegistrySearchBar = PluginRegistrySearchBar;
