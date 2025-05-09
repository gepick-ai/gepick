import { Emitter, Event, InjectableService, PostConstruct, createServiceDecorator } from '@gepick/core/common';
import { ITree, TreeNode } from './tree';
import { FocusableTreeSelection, TreeSelectionState } from './tree-selection-state';
import { SelectableTreeNode, TreeSelection, TreeSelectionService } from './tree-selection';
import { ITreeFocusService } from './tree-focus-service';

export class TreeSelectionServiceImpl extends InjectableService implements TreeSelectionService {
  protected readonly onSelectionChangedEmitter = new Emitter<ReadonlyArray<Readonly<SelectableTreeNode>>>();

  protected state: TreeSelectionState;

  constructor(
    @ITree protected readonly tree: ITree,
    @ITreeFocusService protected readonly focusService: ITreeFocusService,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.state = new TreeSelectionState(this.tree);
  }

  override dispose(): void {
    this.onSelectionChangedEmitter.dispose();
    super.dispose();
  }

  get selectedNodes(): ReadonlyArray<Readonly<SelectableTreeNode>> {
    return this.state.selection();
  }

  get onSelectionChanged(): Event<ReadonlyArray<Readonly<SelectableTreeNode>>> {
    return this.onSelectionChangedEmitter.event;
  }

  protected fireSelectionChanged(): void {
    this.onSelectionChangedEmitter.fire(this.state.selection());
  }

  addSelection(selectionOrTreeNode: TreeSelection | Readonly<SelectableTreeNode>): void {
    const selection = ((arg: TreeSelection | Readonly<SelectableTreeNode>): TreeSelection => {
      const type = TreeSelection.SelectionType.DEFAULT;
      if (TreeSelection.is(arg)) {
        return {
          type,
          ...arg,
        };
      }
      return {
        type,
        node: arg,
      };
    })(selectionOrTreeNode);

    const node = this.validateNode(selection.node);
    if (node === undefined) {
      return;
    }
    Object.assign(selection, { node });

    const newState = this.state.nextState(selection);
    this.transiteTo(newState);
  }

  clearSelection(): void {
    this.transiteTo(new TreeSelectionState(this.tree), false);
  }

  protected transiteTo(newState: TreeSelectionState, setFocus = true): void {
    const oldNodes = this.state.selection();
    const newNodes = newState.selection();

    const toUnselect = this.difference(oldNodes, newNodes);
    const toSelect = this.difference(newNodes, oldNodes);

    this.unselect(toUnselect);
    this.select(toSelect);
    this.removeFocus(oldNodes, newNodes);
    if (setFocus) {
      this.addFocus(newState.node);
    }

    this.state = newState;
    this.fireSelectionChanged();
  }

  protected unselect(nodes: ReadonlyArray<SelectableTreeNode>): void {
    nodes.forEach(node => node.selected = false);
  }

  protected select(nodes: ReadonlyArray<SelectableTreeNode>): void {
    nodes.forEach(node => node.selected = true);
  }

  protected removeFocus(...nodes: ReadonlyArray<SelectableTreeNode>[]): void {
    nodes.forEach(node => node.forEach(n => n.focus = false));
  }

  protected addFocus(node: SelectableTreeNode | undefined): void {
    if (node) {
      node.focus = true;
    }
    this.focusService.setFocus(node);
  }

  /**
   * Returns an array of the difference of two arrays. The returned array contains all elements that are contained by
   * `left` and not contained by `right`. `right` may also contain elements not present in `left`: these are simply ignored.
   */
  protected difference<T>(left: ReadonlyArray<T>, right: ReadonlyArray<T>): ReadonlyArray<T> {
    return left.filter(item => !right.includes(item));
  }

  /**
   * Returns a reference to the argument if the node exists in the tree. Otherwise, `undefined`.
   */
  protected validateNode(node: Readonly<TreeNode>): Readonly<TreeNode> | undefined {
    const result = this.tree.validateNode(node);
    return SelectableTreeNode.is(result) ? result : undefined;
  }

  storeState(): TreeSelectionServiceImpl.State {
    return {
      selectionStack: this.state.selectionStack.map(s => ({
        focus: s.focus && s.focus.id || undefined,
        node: s.node && s.node.id || undefined,
        type: s.type,
      })),
    };
  }

  restoreState(state: any): void {
    const selectionStack: FocusableTreeSelection[] = [];
    for (const selection of state.selectionStack) {
      const node = selection.node && this.tree.getNode(selection.node) || undefined;
      if (!SelectableTreeNode.is(node)) {
        break;
      }
      const focus = selection.focus && this.tree.getNode(selection.focus) || undefined;
      selectionStack.push({
        node,
        focus: SelectableTreeNode.is(focus) && focus || undefined,
        type: selection.type,
      });
    }
    if (selectionStack.length) {
      this.transiteTo(new TreeSelectionState(this.tree, selectionStack));
    }
  }
}

export const ITreeSelectionService = createServiceDecorator<ITreeSelectionService>(TreeSelectionServiceImpl.name);
export type ITreeSelectionService = TreeSelectionServiceImpl;
export namespace TreeSelectionServiceImpl {
  export interface State {
    selectionStack: ReadonlyArray<FocusableTreeSelectionState>;
  }
  export interface FocusableTreeSelectionState {
    focus?: string;
    node?: string;
    type?: TreeSelection.SelectionType;
  }
}
