import { CompositeTreeNode, ExpandableTreeNode, IPreferencesManager, NodeProps, SelectableTreeNode, TopDownTreeIterator, TreeModelImpl, TreeNode, TreeWidget, fuzzy } from "@gepick/core/browser";
import { Emitter, Event, PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { IPreferencesScopeTabBar } from "./views/preferences-scope-tabbar-widget";
import { IPreferencesSearchbarWidget } from "./views/preferences-searchbar-widget";
import { Preference } from "./util/preference-types";
import { IPreferenceTreeGenerator } from "./util/preference-tree-generator";
import { COMMONLY_USED_SECTION_PREFIX } from "./util/preference-layout";

export interface PreferenceTreeNodeProps extends NodeProps {
  visibleChildren: number;
  isExpansible?: boolean;
}

export interface PreferenceTreeNodeRow extends Readonly<TreeWidget.NodeRow>, PreferenceTreeNodeProps {
  node: Preference.TreeNode;
}
export enum PreferenceFilterChangeSource {
  Schema,
  Search,
  Scope,
}
export interface PreferenceFilterChangeEvent {
  source: PreferenceFilterChangeSource;
}

export class PreferenceTreeModel extends TreeModelImpl {
  @IPreferencesSearchbarWidget protected readonly filterInput: IPreferencesSearchbarWidget;
  @IPreferenceTreeGenerator protected readonly treeGenerator: IPreferenceTreeGenerator;
  @IPreferencesScopeTabBar protected readonly scopeTracker: IPreferencesScopeTabBar;
  @IPreferencesManager protected readonly preferencesManager: IPreferencesManager;

  protected readonly onTreeFilterChangedEmitter = new Emitter<PreferenceFilterChangeEvent>();
  readonly onFilterChanged = this.onTreeFilterChangedEmitter.event;

  protected lastSearchedFuzzy: string = '';
  protected lastSearchedLiteral: string = '';
  protected lastSearchedTags: string[] = [];
  protected _currentScope: number = Number(Preference.DEFAULT_SCOPE.scope);
  protected _isFiltered: boolean = false;
  protected _currentRows: Map<string, PreferenceTreeNodeRow> = new Map();
  protected _totalVisibleLeaves = 0;

  get currentRows(): Readonly<Map<string, PreferenceTreeNodeRow>> {
    return this._currentRows;
  }

  get totalVisibleLeaves(): number {
    return this._totalVisibleLeaves;
  }

  get isFiltered(): boolean {
    return this._isFiltered;
  }

  get propertyList(): { [key: string]: any } {
    return this.preferencesManager.getCombinedSchema().properties;
  }

  get currentScope(): Preference.SelectedScopeDetails {
    return this.scopeTracker.currentScope;
  }

  get onSchemaChanged(): Event<CompositeTreeNode> {
    return this.treeGenerator.onSchemaChanged;
  }

  @PostConstruct()
  protected override init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    super.init();
    [
      this.treeGenerator.onSchemaChanged(newTree => this.handleNewSchema(newTree)),
      this.scopeTracker.onScopeChanged((scopeDetails: any) => {
        this._currentScope = scopeDetails.scope;
        this.updateFilteredRows(PreferenceFilterChangeSource.Scope);
      }),
      this.filterInput.onFilterChanged((newSearchTerm) => {
        this.lastSearchedTags = Array.from(newSearchTerm.matchAll(/@tag:(\S+)/g)).map(match => match[0].slice(5));
        const newSearchTermWithoutTags = newSearchTerm.replace(/@tag:\S+/g, '');
        this.lastSearchedLiteral = newSearchTermWithoutTags;
        this.lastSearchedFuzzy = newSearchTermWithoutTags.replace(/\s/g, '');
        this._isFiltered = newSearchTerm.length > 2;
        if (this.isFiltered) {
          this.expandAll();
        }
        else if (CompositeTreeNode.is(this.root)) {
          this.collapseAll(this.root);
        }
        this.updateFilteredRows(PreferenceFilterChangeSource.Search);
      }),
      this.onFilterChanged(() => {
        this.filterInput.updateResultsCount(this._totalVisibleLeaves);
      }),
      this.onTreeFilterChangedEmitter,
    ].forEach(d => this.toDispose.add(d));
    await this.preferencesManager.ready;
    this.handleNewSchema(this.treeGenerator.root);
  }

  private handleNewSchema(newRoot: CompositeTreeNode): void {
    this.root = newRoot;
    if (this.isFiltered) {
      this.expandAll();
    }
    this.updateFilteredRows(PreferenceFilterChangeSource.Schema);
  }

  protected updateRows(): void {
    const root = this.root;
    this._currentRows = new Map();
    if (root) {
      this._totalVisibleLeaves = 0;
      let index = 0;

      for (const node of new TopDownTreeIterator(root, {
        pruneCollapsed: false,
        pruneSiblings: true,
      })) {
        if (TreeNode.isVisible(node) && Preference.TreeNode.is(node)) {
          const { id } = Preference.TreeNode.getGroupAndIdFromNodeId(node.id);
          if (CompositeTreeNode.is(node) || this.passesCurrentFilters(node, id)) {
            this.updateVisibleChildren(node);

            this._currentRows.set(node.id, {
              index: index++,
              node,
              depth: node.depth,
              visibleChildren: 0,
            });
          }
        }
      }
    }
  }

  protected updateFilteredRows(source: PreferenceFilterChangeSource): void {
    this.updateRows();
    this.onTreeFilterChangedEmitter.fire({ source });
  }

  protected passesCurrentFilters(node: Preference.LeafNode, prefID: string): boolean {
    if (!this._isFiltered) {
      return true;
    }
    // When filtering, VSCode will render an item that is present in the commonly used section only once but render both its possible parents in the left-hand tree.
    // E.g. searching for editor.renderWhitespace will show one item in the main panel, but both 'Commonly Used' and 'Text Editor' in the left tree.
    // That seems counterintuitive and introduces a number of special cases, so I prefer to remove the commonly used section entirely when the user searches.
    if (node.id.startsWith(COMMONLY_USED_SECTION_PREFIX)) {
      return false;
    }
    if (!this.lastSearchedTags.every(tag => node.preference.data.tags?.includes(tag))) {
      return false;
    }
    return fuzzy.test(this.lastSearchedFuzzy, prefID) // search matches preference name.
    // search matches description. Fuzzy isn't ideal here because the score depends on the order of discovery.
      || (node.preference.data.description ?? '').includes(this.lastSearchedLiteral);
  }

  protected override isVisibleSelectableNode(node: TreeNode): node is SelectableTreeNode {
    return CompositeTreeNode.is(node) && !!this._currentRows.get(node.id)?.visibleChildren;
  }

  protected updateVisibleChildren(node: TreeNode): void {
    if (!CompositeTreeNode.is(node)) {
      this._totalVisibleLeaves++;
      let nextParent = node.parent?.id && this._currentRows.get(node.parent?.id);
      while (nextParent && nextParent.node !== this.root) {
        if (nextParent) {
          nextParent.visibleChildren += 1;
        }
        nextParent = nextParent.node.parent?.id && this._currentRows.get(nextParent.node.parent?.id);
        if (nextParent) {
          nextParent.isExpansible = true;
        }
      }
    }
  }

  collapseAllExcept(openNode: TreeNode | undefined): void {
    const openNodes: TreeNode[] = [];
    while (ExpandableTreeNode.is(openNode)) {
      openNodes.push(openNode);
      this.expandNode(openNode);
      openNode = openNode.parent;
    }
    if (CompositeTreeNode.is(this.root)) {
      this.root.children.forEach((child) => {
        if (!openNodes.includes(child) && ExpandableTreeNode.is(child)) {
          this.collapseNode(child);
        }
      });
    }
  }

  protected expandAll(): void {
    if (CompositeTreeNode.is(this.root)) {
      this.root.children.forEach((child) => {
        if (ExpandableTreeNode.is(child)) {
          this.expandNode(child);
        }
      });
    }
  }

  getNodeFromPreferenceId(id: string): Preference.TreeNode | undefined {
    const node = this.getNode(this.treeGenerator.getNodeId(id));
    return node && Preference.TreeNode.is(node) ? node : undefined;
  }

  /**
   * @returns true if selection changed, false otherwise
   */
  selectIfNotSelected(node: SelectableTreeNode): boolean {
    const currentlySelected = this.selectedNodes[0];
    if (node !== currentlySelected) {
      this.selectNode(node);
      return true;
    }
    return false;
  }
}

export const IPreferenceTreeModel = createServiceDecorator<IPreferenceTreeModel>(PreferenceTreeModel.name);
export type IPreferenceTreeModel = PreferenceTreeModel;
