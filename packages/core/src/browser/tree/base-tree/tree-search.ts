import { DisposableStore, Emitter, Event, IDisposable, InjectableService, PostConstruct, createServiceDecorator } from '@gepick/core/common';
import { ITree, Tree, TreeNode } from './tree';
import { TreeDecoration } from './tree-decorator';
import { FuzzySearch, IFuzzySearch } from './fuzzy-search';
import { TopDownTreeIterator } from './tree-iterator';

export class TreeSearch extends InjectableService implements IDisposable {
  protected readonly labelProvider = { getName: (node: TreeNode) => node.id };

  protected readonly disposables = new DisposableStore();
  protected readonly filteredNodesEmitter = new Emitter<ReadonlyArray<Readonly<TreeNode>>>();

  protected _filterResult: FuzzySearch.Match<TreeNode>[] = [];
  protected _filteredNodes: ReadonlyArray<Readonly<TreeNode>> = [];
  protected _filteredNodesAndParents: Set<string> = new Set();

  constructor(
    @ITree protected readonly tree: Tree,
    @IFuzzySearch protected readonly fuzzySearch: IFuzzySearch,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.disposables.add(this.filteredNodesEmitter);
  }

  getHighlights(): Map<string, TreeDecoration.CaptionHighlight> {
    return new Map(this._filterResult.map(m => [m.item.id, this.toCaptionHighlight(m)] as [string, TreeDecoration.CaptionHighlight]));
  }

  /**
   * Resolves to all the visible tree nodes that match the search pattern.
   */
  async filter(pattern: string | undefined): Promise<ReadonlyArray<Readonly<TreeNode>>> {
    const { root } = this.tree;
    this._filteredNodesAndParents = new Set();
    if (!pattern || !root) {
      this._filterResult = [];
      this._filteredNodes = [];
      this.fireFilteredNodesChanged(this._filteredNodes);
      return [];
    }
    const items = [...new TopDownTreeIterator(root)];
    const transform = (node: TreeNode) => this.labelProvider.getName(node);
    this._filterResult = await this.fuzzySearch.filter({
      items,
      pattern,
      transform,
    });
    this._filteredNodes = this._filterResult.map(({ item }) => {
      this.addAllParentsToFilteredSet(item);
      return item;
    });
    this.fireFilteredNodesChanged(this._filteredNodes);
    return this._filteredNodes.slice();
  }

  protected addAllParentsToFilteredSet(node: TreeNode): void {
    let toAdd: TreeNode | undefined = node;
    while (toAdd && !this._filteredNodesAndParents.has(toAdd.id)) {
      this._filteredNodesAndParents.add(toAdd.id);
      toAdd = toAdd.parent;
    };
  }

  /**
   * Returns with the filtered nodes after invoking the `filter` method.
   */
  get filteredNodes(): ReadonlyArray<Readonly<TreeNode>> {
    return this._filteredNodes.slice();
  }

  /**
   * Event that is fired when the filtered nodes have been changed.
   */
  get onFilteredNodesChanged(): Event<ReadonlyArray<Readonly<TreeNode>>> {
    return this.filteredNodesEmitter.event;
  }

  passesFilters(node: TreeNode): boolean {
    return this._filteredNodesAndParents.has(node.id);
  }

  override dispose(): void {
    this.disposables.dispose();
    super.dispose();
  }

  protected fireFilteredNodesChanged(nodes: ReadonlyArray<Readonly<TreeNode>>): void {
    this.filteredNodesEmitter.fire(nodes);
  }

  protected toCaptionHighlight(match: FuzzySearch.Match<TreeNode>): TreeDecoration.CaptionHighlight {
    return {
      ranges: match.ranges.map(this.mapRange.bind(this)),
    };
  }

  protected mapRange(range: FuzzySearch.Range): TreeDecoration.CaptionHighlight.Range {
    const { offset, length } = range;
    return {
      offset,
      length,
    };
  }
}

export const ITreeSearch = createServiceDecorator(TreeSearch.name);
export type ITreeSearch = TreeSearch;
