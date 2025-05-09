import { Emitter, Event, InjectableService, createServiceDecorator } from '@gepick/core/common';
import { ITree, TreeNode } from './tree';
import { SelectableTreeNode } from './tree-selection';

export interface TreeFocusService {
  readonly focusedNode: SelectableTreeNode | undefined;
  readonly onDidChangeFocus: Event<SelectableTreeNode | undefined>;
  setFocus: (node?: SelectableTreeNode) => void;
  hasFocus: (node?: TreeNode) => boolean;
}
export const TreeFocusService = Symbol('TreeFocusService');

export class TreeFocusServiceImpl extends InjectableService implements TreeFocusService {
  protected focusedId: string | undefined;
  protected onDidChangeFocusEmitter = new Emitter<SelectableTreeNode | undefined>();
  get onDidChangeFocus(): Event<SelectableTreeNode | undefined> { return this.onDidChangeFocusEmitter.event; }

  @ITree protected readonly tree: ITree;

  get focusedNode(): SelectableTreeNode | undefined {
    const candidate = this.tree.getNode(this.focusedId);
    if (SelectableTreeNode.is(candidate)) {
      return candidate;
    }

    return undefined;
  }

  setFocus(node?: SelectableTreeNode): void {
    if (node?.id !== this.focusedId) {
      this.focusedId = node?.id;
      this.onDidChangeFocusEmitter.fire(node);
    }
  }

  hasFocus(node?: TreeNode): boolean {
    return !!node && node?.id === this.focusedId;
  }
}
export const ITreeFocusService = createServiceDecorator<ITreeFocusService>(TreeFocusServiceImpl.name);
export type ITreeFocusService = TreeFocusServiceImpl;
