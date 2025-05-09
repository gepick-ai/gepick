import { MenuNode, MenuPath } from '../../../common';
import { NAVIGATION, RenderedToolbarItem } from './tab-bar-toolbar-types';

export const TOOLBAR_WRAPPER_ID_SUFFIX = '-as-tabbar-toolbar-item';

export class ToolbarMenuNodeWrapper implements RenderedToolbarItem {
  constructor(protected readonly menuNode: MenuNode, readonly group: string | undefined, readonly delegateMenuPath: MenuPath, readonly menuPath?: MenuPath) { }
  get id(): string { return this.menuNode.id + TOOLBAR_WRAPPER_ID_SUFFIX; }
  get command(): string { return this.menuNode.command ?? ''; };
  get icon(): string | undefined { return this.menuNode.icon; }
  get tooltip(): string | undefined { return this.menuNode.label; }
  get when(): string | undefined { return this.menuNode.when; }
  get text(): string | undefined { return (this.group === NAVIGATION || this.group === undefined) ? undefined : this.menuNode.label; }
}
