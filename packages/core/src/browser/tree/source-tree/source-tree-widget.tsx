import * as React from 'react';
import { Container, DisposableCollection, PostConstruct, interfaces } from '@gepick/core/common';
import { TREE_NODE_SEGMENT_GROW_CLASS, TreeModel, TreeNode, TreeProps, TreeWidget, createTreeContainer } from '../base-tree';
import { TreeElement, TreeSource } from './tree-source';
import { SourceTree, TreeElementNode, TreeSourceNode } from './source-tree';

export class SourceTreeWidget extends TreeWidget {
  static createContainer(parent: interfaces.Container, props?: Partial<TreeProps>): Container {
    const child = createTreeContainer(parent, {
      props,
      tree: SourceTree,
      widget: SourceTreeWidget,
    });

    return child;
  }

  @PostConstruct()
  protected override init(): void {
    super.init();
    this.addClass('theia-source-tree');
    this._register(this.model.onOpenNode((node) => {
      if (TreeElementNode.is(node) && node.element.open) {
        node.element.open();
      }
    }));
  }

  protected readonly toDisposeOnSource = new DisposableCollection();
  get source(): TreeSource | undefined {
    const root = this.model.root;
    return TreeSourceNode.is(root) ? root.source : undefined;
  }

  set source(source: TreeSource | undefined) {
    if (this.source === source) {
      return;
    }
    this.toDisposeOnSource.dispose();
    this._register(this.toDisposeOnSource);
    this.model.root = TreeSourceNode.to(source);
    if (source) {
      this.toDisposeOnSource.push(source.onDidChange(() => {
        this.model.refresh();
      }));
    }
  }

  get selectedElement(): TreeElement | undefined {
    const node = this.model.selectedNodes[0];
    return TreeElementNode.is(node) && node.element || undefined;
  }

  protected override renderTree(model: TreeModel): React.ReactNode {
    if (TreeSourceNode.is(model.root) && model.root.children.length === 0) {
      const { placeholder } = model.root.source;
      if (placeholder) {
        return <div className="theia-tree-source-node-placeholder noselect">{placeholder}</div>;
      }
    }
    return super.renderTree(model);
  }

  protected override renderCaption(node: TreeNode): React.ReactNode {
    if (TreeElementNode.is(node)) {
      const classNames = this.createTreeElementNodeClassNames(node);
      return <div className={classNames.join(' ')}>{node.element.render(this)}</div>;
    }
    return undefined;
  }

  protected createTreeElementNodeClassNames(_node: TreeElementNode): string[] {
    return [TREE_NODE_SEGMENT_GROW_CLASS];
  }

  override storeState(): object {
    // no-op
    return {};
  }

  protected superStoreState(): object {
    return super.storeState();
  }

  override restoreState(_state: object): void {
    // no-op
  }

  protected superRestoreState(state: object): void {
    super.restoreState(state);
  }
}
