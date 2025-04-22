import { ExpandableTreeNode, ITreeProps, React, TREE_NODE_CONTENT_CLASS, TreeNode, TreeWidget } from "@gepick/core/browser";
import { PostConstruct, createServiceDecorator } from "@gepick/core/common";
import { Preference } from "../util/preference-types";
import { IPreferenceTreeModel, PreferenceTreeNodeProps, PreferenceTreeNodeRow } from "../preferences-tree-model";

export class PreferencesTreeWidget extends TreeWidget {
  static ID = 'preferences.tree';

  protected shouldFireSelectionEvents: boolean = true;
  protected firstVisibleLeafNodeID: string;

  @IPreferenceTreeModel declare readonly model: IPreferenceTreeModel;
  @ITreeProps protected readonly treeProps: ITreeProps;

  @PostConstruct()
  override init(): void {
    super.init();
    this.id = PreferencesTreeWidget.ID;
    this.toDispose.pushAll([
      this.model.onFilterChanged(() => {
        this.updateRows();
      }),
    ]);
  }

  override doUpdateRows(): void {
    this.rows = new Map();
    let index = 0;
    for (const [id, nodeRow] of this.model.currentRows.entries()) {
      if (nodeRow.visibleChildren > 0 && this.isVisibleNode(nodeRow.node)) {
        this.rows.set(id, { ...nodeRow, index: index++ });
      }
    }
    this.updateScrollToRow();
  }

  protected isVisibleNode(node: Preference.TreeNode): boolean {
    if (Preference.TreeNode.isTopLevel(node)) {
      return true;
    }
    else {
      return ExpandableTreeNode.isExpanded(node.parent) && Preference.TreeNode.is(node.parent) && this.isVisibleNode(node.parent);
    }
  }

  protected override doRenderNodeRow({ depth, visibleChildren, node, isExpansible }: PreferenceTreeNodeRow): React.ReactNode {
    return this.renderNode(node, { depth, visibleChildren, isExpansible });
  }

  protected override renderNode(node: TreeNode, props: PreferenceTreeNodeProps): React.ReactNode {
    if (!TreeNode.isVisible(node)) {
      return undefined;
    }

    const attributes = this.createNodeAttributes(node, props);

    const content = (
      <div className={TREE_NODE_CONTENT_CLASS}>
        {this.renderExpansionToggle(node, props)}
        {this.renderCaption(node, props)}
      </div>
    );
    return React.createElement('div', attributes, content);
  }

  protected override renderExpansionToggle(node: TreeNode, props: PreferenceTreeNodeProps): React.ReactNode {
    if (ExpandableTreeNode.is(node) && !props.isExpansible) {
      return <div className="preferences-tree-spacer" />;
    }
    return super.renderExpansionToggle(node, props);
  }

  protected override toNodeName(node: TreeNode): string {
    const visibleChildren = this.model.currentRows.get(node.id)?.visibleChildren;
    const baseName = this.labelProvider.getName(node);
    const printedNameWithVisibleChildren = this.model.isFiltered && visibleChildren !== undefined
      ? `${baseName} (${visibleChildren})`
      : baseName;
    return printedNameWithVisibleChildren;
  }
}

export const IPreferencesTreeWidget = createServiceDecorator<IPreferencesTreeWidget>(PreferencesTreeWidget.name);
export type IPreferencesTreeWidget = PreferencesTreeWidget;
