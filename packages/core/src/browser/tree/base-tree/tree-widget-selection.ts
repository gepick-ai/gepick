import { TreeWidget } from './tree-widget';
import { SelectableTreeNode } from './tree-selection';

export type TreeWidgetSelection = ReadonlyArray<Readonly<SelectableTreeNode>> & {
  source: TreeWidget;
};
export namespace TreeWidgetSelection {
  export function isSource(selection: unknown, source: TreeWidget): selection is TreeWidgetSelection {
    return getSource(selection) === source;
  }
  export function getSource(selection: unknown): TreeWidget | undefined {
    return is(selection) ? selection.source : undefined;
  }
  export function is(selection: unknown): selection is TreeWidgetSelection {
    return Array.isArray(selection) && ('source' in selection) && (selection as TreeWidgetSelection).source instanceof TreeWidget;
  }

  export function create(source: TreeWidget): TreeWidgetSelection {
    const focusedNode = source.model.getFocusedNode();
    const selectedNodes = source.model.selectedNodes;
    const focusedIndex = selectedNodes.indexOf(focusedNode as SelectableTreeNode);
    // Ensure that the focused node is at index 0 - used as default single selection.
    if (focusedNode && focusedIndex > 0) {
      const selection = [focusedNode, ...selectedNodes.slice(0, focusedIndex), ...selectedNodes.slice(focusedIndex + 1)];
      return Object.assign(selection, { source });
    }
    return Object.assign(selectedNodes, { source });
  }
}
