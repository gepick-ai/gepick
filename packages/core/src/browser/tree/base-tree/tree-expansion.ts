import { Emitter, Event, IDisposable, InjectableService, PostConstruct, createServiceDecorator } from '@gepick/core/common';
import { CompositeTreeNode, ITree, TreeNode } from './tree';

export const TreeExpansionService = Symbol('TreeExpansionService');

/**
 * The tree expandable service.
 */
export interface TreeExpansionService extends IDisposable {
  /**
   * Emit when the node is expanded or collapsed.
   */
  readonly onExpansionChanged: Event<Readonly<ExpandableTreeNode>>;
  /**
   * Expand a node for the given node id if it is valid and collapsed.
   * Expanding a node refreshes all its children.
   *
   * Return a valid expanded refreshed node or `undefined` if such does not exist.
   */
  expandNode: (node: Readonly<ExpandableTreeNode>) => Promise<Readonly<ExpandableTreeNode> | undefined>;
  /**
   * If the given node is valid and expanded then collapse it.
   *
   * Return true if a node has been collapsed; otherwise false.
   */
  collapseNode: (node: Readonly<ExpandableTreeNode>) => Promise<boolean>;
  /**
   * If the given node is valid then collapse it recursively.
   *
   * Return true if a node has been collapsed; otherwise false.
   */
  collapseAll: (node: Readonly<CompositeTreeNode>) => Promise<boolean>;
  /**
   * If the given node is invalid then does nothing.
   * If the given node is collapsed then expand it; otherwise collapse it.
   */
  toggleNodeExpansion: (node: Readonly<ExpandableTreeNode>) => Promise<void>;
}

/**
 * The expandable tree node.
 */
export interface ExpandableTreeNode extends CompositeTreeNode {
  /**
   * Test whether this tree node is expanded.
   */
  expanded: boolean;
}

export namespace ExpandableTreeNode {
  export function is(node: unknown): node is ExpandableTreeNode {
    return !!node && CompositeTreeNode.is(node) && 'expanded' in node;
  }

  export function isExpanded(node: unknown): node is ExpandableTreeNode {
    return ExpandableTreeNode.is(node) && node.expanded;
  }

  export function isCollapsed(node: unknown): node is ExpandableTreeNode {
    return ExpandableTreeNode.is(node) && !node.expanded;
  }
}

export class TreeExpansionServiceImpl extends InjectableService implements TreeExpansionService {
  protected readonly onExpansionChangedEmitter = new Emitter<ExpandableTreeNode>();

  constructor(
    @ITree protected readonly tree: ITree,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.tree.onNodeRefreshed((node) => {
      for (const child of node.children) {
        if (ExpandableTreeNode.isExpanded(child)) {
          node.waitUntil(this.tree.refresh(child));
        }
      }
    });
  }

  override dispose(): void {
    this.onExpansionChangedEmitter.dispose();
    super.dispose();
  }

  get onExpansionChanged(): Event<ExpandableTreeNode> {
    return this.onExpansionChangedEmitter.event;
  }

  protected fireExpansionChanged(node: ExpandableTreeNode): void {
    this.onExpansionChangedEmitter.fire(node);
  }

  async expandNode(raw: ExpandableTreeNode): Promise<ExpandableTreeNode | undefined> {
    const node = this.tree.validateNode(raw);
    if (ExpandableTreeNode.isCollapsed(node)) {
      return this.doExpandNode(node);
    }
    return undefined;
  }

  protected async doExpandNode(node: ExpandableTreeNode): Promise<ExpandableTreeNode | undefined> {
    const refreshed = await this.tree.refresh(node);
    if (ExpandableTreeNode.is(refreshed)) {
      refreshed.expanded = true;
      this.fireExpansionChanged(refreshed);
      return refreshed;
    }
    return undefined;
  }

  async collapseNode(raw: ExpandableTreeNode): Promise<boolean> {
    const node = this.tree.validateNode(raw);
    return this.doCollapseNode(node);
  }

  async collapseAll(raw: CompositeTreeNode): Promise<boolean> {
    const node = this.tree.validateNode(raw);
    return this.doCollapseAll(node);
  }

  protected doCollapseAll(node: TreeNode | undefined): boolean {
    let result = false;
    if (CompositeTreeNode.is(node)) {
      for (const child of node.children) {
        result = this.doCollapseAll(child) || result;
      }
    }
    return this.doCollapseNode(node) || result;
  }

  protected doCollapseNode(node: TreeNode | undefined): boolean {
    if (!ExpandableTreeNode.isExpanded(node)) {
      return false;
    }
    node.expanded = false;
    this.fireExpansionChanged(node);
    return true;
  }

  async toggleNodeExpansion(node: ExpandableTreeNode): Promise<void> {
    if (node.expanded) {
      await this.collapseNode(node);
    }
    else {
      await this.expandNode(node);
    }
  }
}
export const ITreeExpansionService = createServiceDecorator<ITreeExpansionService>(TreeExpansionServiceImpl.name);
export type ITreeExpansionService = TreeExpansionServiceImpl;
