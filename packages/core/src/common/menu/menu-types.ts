import { IDisposable } from '../lifecycle';
import { isObject } from '../types';

export type MenuPath = string[];
export const MAIN_MENU_BAR: MenuPath = ['menubar'];
export const MANAGE_MENU: MenuPath = ['manage_menu'];
export const ACCOUNTS_MENU: MenuPath = ['accounts_menu'];
export const ACCOUNTS_SUBMENU = [...ACCOUNTS_MENU, '1_accounts_submenu'];

/**
 * @internal
 */
export interface MenuNodeMetadata {
  /**
   * technical identifier.
   */
  readonly id: string;
  /**
   * Menu nodes are sorted in ascending order based on their `sortString`.
   */
  readonly sortString: string;
  /**
   * Condition under which the menu node should be rendered.
   * See https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts
   */
  readonly when?: string;
  /**
   * A reference to the parent node - useful for determining the menu path by which the node can be accessed.
   */
  readonly parent?: MenuNode;
}

/**
 * Metadata for the visual presentation of a node.
 * @internal
 */
export interface MenuNodeRenderingData {
  /**
   * Optional label. Will be rendered as text of the menu item.
   */
  readonly label?: string;
  /**
   * Icon classes for the menu node. If present, these will produce an icon to the left of the label in browser-style menus.
   */
  readonly icon?: string;
}

export interface MenuNodeBase extends MenuNodeMetadata, MenuNodeRenderingData { }

/**
 * A menu entry representing an action, e.g. "New File".
 */
export interface MenuAction extends MenuNodeRenderingData, Pick<MenuNodeMetadata, 'when'> {

  /**
   * The command to execute.
   */
  commandId: string;
  /**
   * In addition to the mandatory command property, an alternative command can be defined.
   * It will be shown and invoked when pressing Alt while opening a menu.
   */
  alt?: string;
  /**
   * Menu entries are sorted in ascending order based on their `order` strings. If omitted the determined
   * label will be used instead.
   */
  order?: string;
}

export namespace MenuAction {
  /* Determine whether object is a MenuAction */
  export function is(arg: unknown): arg is MenuAction {
    return isObject(arg) && 'commandId' in arg;
  }
}

/**
 * Additional options when creating a new submenu.
 */
export interface SubMenuOptions extends Pick<MenuAction, 'order'>, Pick<MenuNodeMetadata, 'when'>, Partial<Pick<CompoundMenuNode, 'role' | 'label' | 'icon'>> {
  /**
   * The class to use for the submenu icon.
   * @deprecated use `icon` instead;
   */
  iconClass?: string;
}

export const enum CompoundMenuNodeRole {
  /** Indicates that the node should be rendered as submenu that opens a new menu on hover */
  Submenu,
  /** Indicates that the node's children should be rendered as group separated from other items by a separator */
  Group,
  /** Indicates that the node's children should be treated as though they were direct children of the node's parent */
  Flat,
}

export interface CompoundMenuNode extends MenuNodeBase {
  /**
   * Items that are grouped under this menu.
   */
  readonly children: ReadonlyArray<MenuNode>;
  /**
   * @deprecated @since 1.28 use `role` instead.
   * Whether the item should be rendered as a submenu.
   */
  readonly isSubmenu: boolean;
  /**
   * How the node and its children should be rendered. See {@link CompoundMenuNodeRole}.
   */
  readonly role: CompoundMenuNodeRole;
}

export interface MutableCompoundMenuNode extends CompoundMenuNode {
  /**
   * Inserts the given node at the position indicated by `sortString`.
   *
   * @returns a disposable which, when called, will remove the given node again.
   */
  addNode: (node: MenuNode) => IDisposable;
  /**
   * Removes the first node with the given id.
   *
   * @param id node id.
   * @returns true if the id was present
   */
  removeNode: (id: string) => boolean;

  /**
   * Fills any `undefined` fields with the values from the {@link options}.
   */
  updateOptions: (options: SubMenuOptions) => void;
}

export namespace CompoundMenuNode {
  export function is(node?: MenuNode): node is CompoundMenuNode { return !!node && Array.isArray(node.children); }
  export function getRole(node: MenuNode): CompoundMenuNodeRole | undefined {
    if (!is(node)) { return undefined; }
    return node.role ?? (node.label ? CompoundMenuNodeRole.Submenu : CompoundMenuNodeRole.Group);
  }
  export function sortChildren(m1: MenuNode, m2: MenuNode): number {
    // The navigation group is special as it will always be sorted to the top/beginning of a menu.
    if (isNavigationGroup(m1)) {
      return -1;
    }
    if (isNavigationGroup(m2)) {
      return 1;
    }
    return m1.sortString.localeCompare(m2.sortString);
  }

  /** Collapses the children of any subemenus with role {@link CompoundMenuNodeRole Flat} and sorts */
  export function getFlatChildren(children: ReadonlyArray<MenuNode>): MenuNode[] {
    const childrenToMerge: ReadonlyArray<MenuNode>[] = [];
    return children.filter((child) => {
      if (getRole(child) === CompoundMenuNodeRole.Flat) {
        childrenToMerge.push((child as CompoundMenuNode).children);
        return false;
      }
      return true;
    }).concat(...childrenToMerge).sort(sortChildren);
  }

  /**
   * Indicates whether the given node is the special `navigation` menu.
   *
   * @param node the menu node to check.
   * @returns `true` when the given node is a {@link CompoundMenuNode} with id `navigation`,
   * `false` otherwise.
   */
  export function isNavigationGroup(node: MenuNode): node is CompoundMenuNode {
    return is(node) && node.id === 'navigation';
  }

  export function isMutable(node?: MenuNode): node is MutableCompoundMenuNode {
    const candidate = node as MutableCompoundMenuNode;
    return is(candidate) && typeof candidate.addNode === 'function' && typeof candidate.removeNode === 'function';
  }
}

export interface CommandMenuNode extends MenuNodeBase {
  command: string;
}

export namespace CommandMenuNode {
  export function is(candidate?: MenuNode): candidate is CommandMenuNode { return Boolean(candidate?.command); }
  export function hasAltHandler(candidate?: MenuNode): candidate is AlternativeHandlerMenuNode {
    const asAltNode = candidate as AlternativeHandlerMenuNode;
    return is(asAltNode) && is(asAltNode?.altNode);
  }
}

export interface AlternativeHandlerMenuNode extends CommandMenuNode {
  altNode: CommandMenuNode;
}

/**
 * Base interface of the nodes used in the menu tree structure.
 */
export type MenuNode = MenuNodeMetadata
  & MenuNodeRenderingData
  & Partial<CompoundMenuNode>
  & Partial<CommandMenuNode>
  & Partial<AlternativeHandlerMenuNode>;
