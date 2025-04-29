import { Command, Contribution, IMenuContribution, InjectableService, MAIN_MENU_BAR, MANAGE_MENU, MenuModelRegistry } from '@gepick/core/common';
import { IShell, SHELL_TABBAR_CONTEXT_CLOSE, SHELL_TABBAR_CONTEXT_COPY, SHELL_TABBAR_CONTEXT_PIN, SHELL_TABBAR_CONTEXT_SPLIT } from '../shell';
import { codicon } from '../widget';
import { ApplicationContribution, IApplicationContribution } from './application-contribution';

export namespace CommonMenus {

  export const FILE = [...MAIN_MENU_BAR, '1_file'];
  export const FILE_NEW_TEXT = [...FILE, '1_new_text'];
  export const FILE_NEW = [...FILE, '1_new'];
  export const FILE_OPEN = [...FILE, '2_open'];
  export const FILE_SAVE = [...FILE, '3_save'];
  export const FILE_AUTOSAVE = [...FILE, '4_autosave'];
  export const FILE_SETTINGS = [...FILE, '5_settings'];
  export const FILE_SETTINGS_SUBMENU = [...FILE_SETTINGS, '1_settings_submenu'];
  export const FILE_SETTINGS_SUBMENU_OPEN = [...FILE_SETTINGS_SUBMENU, '1_settings_submenu_open'];
  export const FILE_SETTINGS_SUBMENU_THEME = [...FILE_SETTINGS_SUBMENU, '2_settings_submenu_theme'];
  export const FILE_CLOSE = [...FILE, '6_close'];

  export const FILE_NEW_CONTRIBUTIONS = 'file/newFile';

  export const EDIT = [...MAIN_MENU_BAR, '2_edit'];
  export const EDIT_UNDO = [...EDIT, '1_undo'];
  export const EDIT_CLIPBOARD = [...EDIT, '2_clipboard'];
  export const EDIT_FIND = [...EDIT, '3_find'];

  export const VIEW = [...MAIN_MENU_BAR, '4_view'];
  export const VIEW_PRIMARY = [...VIEW, '0_primary'];
  export const VIEW_APPEARANCE = [...VIEW, '1_appearance'];
  export const VIEW_APPEARANCE_SUBMENU = [...VIEW_APPEARANCE, '1_appearance_submenu'];
  export const VIEW_APPEARANCE_SUBMENU_SCREEN = [...VIEW_APPEARANCE_SUBMENU, '2_appearance_submenu_screen'];
  export const VIEW_APPEARANCE_SUBMENU_BAR = [...VIEW_APPEARANCE_SUBMENU, '3_appearance_submenu_bar'];
  export const VIEW_EDITOR_SUBMENU = [...VIEW_APPEARANCE, '2_editor_submenu'];
  export const VIEW_EDITOR_SUBMENU_SPLIT = [...VIEW_EDITOR_SUBMENU, '1_editor_submenu_split'];
  export const VIEW_EDITOR_SUBMENU_ORTHO = [...VIEW_EDITOR_SUBMENU, '2_editor_submenu_ortho'];
  export const VIEW_VIEWS = [...VIEW, '2_views'];
  export const VIEW_LAYOUT = [...VIEW, '3_layout'];
  export const VIEW_TOGGLE = [...VIEW, '4_toggle'];

  export const MANAGE_GENERAL = [...MANAGE_MENU, '1_manage_general'];
  export const MANAGE_SETTINGS = [...MANAGE_MENU, '2_manage_settings'];
  export const MANAGE_SETTINGS_THEMES = [...MANAGE_SETTINGS, '1_manage_settings_themes'];

  // last menu item
  export const HELP = [...MAIN_MENU_BAR, '9_help'];

}

export namespace CommonCommands {

  export const FILE_CATEGORY = 'File';
  export const VIEW_CATEGORY = 'View';
  export const CREATE_CATEGORY = 'Create';
  export const PREFERENCES_CATEGORY = 'Preferences';
  export const MANAGE_CATEGORY = 'Manage';
  export const FILE_CATEGORY_KEY = FILE_CATEGORY;
  export const VIEW_CATEGORY_KEY = VIEW_CATEGORY;
  export const PREFERENCES_CATEGORY_KEY = PREFERENCES_CATEGORY;

  export const OPEN: Command = {
    id: 'core.open',
  };

  export const CUT = Command.toDefaultLocalizedCommand({
    id: 'core.cut',
    label: 'Cut',
  });
  export const COPY = Command.toDefaultLocalizedCommand({
    id: 'core.copy',
    label: 'Copy',
  });
  export const PASTE = Command.toDefaultLocalizedCommand({
    id: 'core.paste',
    label: 'Paste',
  });

  export const COPY_PATH = Command.toDefaultLocalizedCommand({
    id: 'core.copy.path',
    label: 'Copy Path',
  });

  export const UNDO = Command.toDefaultLocalizedCommand({
    id: 'core.undo',
    label: 'Undo',
  });
  export const REDO = Command.toDefaultLocalizedCommand({
    id: 'core.redo',
    label: 'Redo',
  });
  export const SELECT_ALL = Command.toDefaultLocalizedCommand({
    id: 'core.selectAll',
    label: 'Select All',
  });

  export const FIND = Command.toDefaultLocalizedCommand({
    id: 'core.find',
    label: 'Find',
  });
  export const REPLACE = Command.toDefaultLocalizedCommand({
    id: 'core.replace',
    label: 'Replace',
  });

  export const NEXT_TAB = Command.toDefaultLocalizedCommand({
    id: 'core.nextTab',
    category: VIEW_CATEGORY,
    label: 'Show Next Tab',
  });
  export const PREVIOUS_TAB = Command.toDefaultLocalizedCommand({
    id: 'core.previousTab',
    category: VIEW_CATEGORY,
    label: 'Show Previous Tab',
  });
  export const NEXT_TAB_IN_GROUP = Command.toLocalizedCommand({
    id: 'core.nextTabInGroup',
    category: VIEW_CATEGORY,
    label: 'Switch to Next Tab in Group',
  }, 'theia/core/common/showNextTabInGroup', VIEW_CATEGORY_KEY);
  export const PREVIOUS_TAB_IN_GROUP = Command.toLocalizedCommand({
    id: 'core.previousTabInGroup',
    category: VIEW_CATEGORY,
    label: 'Switch to Previous Tab in Group',
  }, 'theia/core/common/showPreviousTabInGroup', VIEW_CATEGORY_KEY);
  export const NEXT_TAB_GROUP = Command.toLocalizedCommand({
    id: 'core.nextTabGroup',
    category: VIEW_CATEGORY,
    label: 'Switch to Next Tab Group',
  }, 'theia/core/common/showNextTabGroup', VIEW_CATEGORY_KEY);
  export const PREVIOUS_TAB_GROUP = Command.toLocalizedCommand({
    id: 'core.previousTabBar',
    category: VIEW_CATEGORY,
    label: 'Switch to Previous Tab Group',
  }, 'theia/core/common/showPreviousTabGroup', VIEW_CATEGORY_KEY);
  export const CLOSE_TAB = Command.toLocalizedCommand({
    id: 'core.close.tab',
    category: VIEW_CATEGORY,
    label: 'Close Tab',
  }, 'theia/core/common/closeTab', VIEW_CATEGORY_KEY);
  export const CLOSE_OTHER_TABS = Command.toLocalizedCommand({
    id: 'core.close.other.tabs',
    category: VIEW_CATEGORY,
    label: 'Close Other Tabs',
  }, 'theia/core/common/closeOthers', VIEW_CATEGORY_KEY);
  export const CLOSE_SAVED_TABS = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.closeUnmodifiedEditors',
    category: VIEW_CATEGORY,
    label: 'Close Saved Editors in Group',
  });
  export const CLOSE_RIGHT_TABS = Command.toLocalizedCommand({
    id: 'core.close.right.tabs',
    category: VIEW_CATEGORY,
    label: 'Close Tabs to the Right',
  }, 'theia/core/common/closeRight', VIEW_CATEGORY_KEY);
  export const CLOSE_ALL_TABS = Command.toLocalizedCommand({
    id: 'core.close.all.tabs',
    category: VIEW_CATEGORY,
    label: 'Close All Tabs',
  }, 'theia/core/common/closeAll', VIEW_CATEGORY_KEY);
  export const CLOSE_MAIN_TAB = Command.toLocalizedCommand({
    id: 'core.close.main.tab',
    category: VIEW_CATEGORY,
    label: 'Close Tab in Main Area',
  }, 'theia/core/common/closeTabMain', VIEW_CATEGORY_KEY);
  export const CLOSE_OTHER_MAIN_TABS = Command.toLocalizedCommand({
    id: 'core.close.other.main.tabs',
    category: VIEW_CATEGORY,
    label: 'Close Other Tabs in Main Area',
  }, 'theia/core/common/closeOtherTabMain', VIEW_CATEGORY_KEY);
  export const CLOSE_ALL_MAIN_TABS = Command.toLocalizedCommand({
    id: 'core.close.all.main.tabs',
    category: VIEW_CATEGORY,
    label: 'Close All Tabs in Main Area',
  }, 'theia/core/common/closeAllTabMain', VIEW_CATEGORY_KEY);
  export const COLLAPSE_PANEL = Command.toLocalizedCommand({
    id: 'core.collapse.tab',
    category: VIEW_CATEGORY,
    label: 'Collapse Side Panel',
  }, 'theia/core/common/collapseTab', VIEW_CATEGORY_KEY);
  export const COLLAPSE_ALL_PANELS = Command.toLocalizedCommand({
    id: 'core.collapse.all.tabs',
    category: VIEW_CATEGORY,
    label: 'Collapse All Side Panels',
  }, 'theia/core/common/collapseAllTabs', VIEW_CATEGORY_KEY);
  export const TOGGLE_BOTTOM_PANEL = Command.toLocalizedCommand({
    id: 'core.toggle.bottom.panel',
    category: VIEW_CATEGORY,
    label: 'Toggle Bottom Panel',
  }, 'theia/core/common/collapseBottomPanel', VIEW_CATEGORY_KEY);
  export const TOGGLE_LEFT_PANEL = Command.toLocalizedCommand({
    id: 'core.toggle.left.panel',
    category: VIEW_CATEGORY,
    label: 'Toggle Left Panel',
  }, 'theia/core/common/collapseLeftPanel', VIEW_CATEGORY_KEY);
  export const TOGGLE_RIGHT_PANEL = Command.toLocalizedCommand({
    id: 'core.toggle.right.panel',
    category: VIEW_CATEGORY,
    label: 'Toggle Right Panel',
  }, 'theia/core/common/collapseRightPanel', VIEW_CATEGORY_KEY);
  export const TOGGLE_STATUS_BAR = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.toggleStatusbarVisibility',
    category: VIEW_CATEGORY,
    label: 'Toggle Status Bar Visibility',
  });
  export const PIN_TAB = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.pinEditor',
    category: VIEW_CATEGORY,
    label: 'Pin Editor',
  });
  export const UNPIN_TAB = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.unpinEditor',
    category: VIEW_CATEGORY,
    label: 'Unpin Editor',
  });
  export const TOGGLE_MAXIMIZED = Command.toLocalizedCommand({
    id: 'core.toggleMaximized',
    category: VIEW_CATEGORY,
    label: 'Toggle Maximized',
  }, 'theia/core/common/toggleMaximized', VIEW_CATEGORY_KEY);
  export const OPEN_VIEW = Command.toDefaultLocalizedCommand({
    id: 'core.openView',
    category: VIEW_CATEGORY,
    label: 'Open View...',
  });
  export const SHOW_MENU_BAR = Command.toDefaultLocalizedCommand({
    id: 'window.menuBarVisibility',
    category: VIEW_CATEGORY,
    label: 'Toggle Menu Bar',
  });
  /**
   * Command Parameters:
   * - `fileName`: string
   * - `directory`: URI
   */
  export const NEW_FILE = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.files.newFile',
    category: FILE_CATEGORY,
  });
  // This command immediately opens a new untitled text file
  // Some VS Code extensions use this command to create new files
  export const NEW_UNTITLED_TEXT_FILE = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.files.newUntitledFile',
    category: FILE_CATEGORY,
    label: 'New Untitled Text File',
  });
  // This command opens a quick pick to select a file type to create
  export const PICK_NEW_FILE = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.files.pickNewFile',
    category: CREATE_CATEGORY,
    label: 'New File...',
  });
  export const SAVE = Command.toDefaultLocalizedCommand({
    id: 'core.save',
    category: FILE_CATEGORY,
    label: 'Save',
  });
  export const SAVE_AS = Command.toDefaultLocalizedCommand({
    id: 'file.saveAs',
    category: FILE_CATEGORY,
    label: 'Save As...',
  });
  export const SAVE_WITHOUT_FORMATTING = Command.toDefaultLocalizedCommand({
    id: 'core.saveWithoutFormatting',
    category: FILE_CATEGORY,
    label: 'Save without Formatting',
  });
  export const SAVE_ALL = Command.toDefaultLocalizedCommand({
    id: 'core.saveAll',
    category: FILE_CATEGORY,
    label: 'Save All',
  });

  export const AUTO_SAVE = Command.toDefaultLocalizedCommand({
    id: 'textEditor.commands.autosave',
    category: FILE_CATEGORY,
    label: 'Auto Save',
  });

  export const ABOUT_COMMAND = Command.toDefaultLocalizedCommand({
    id: 'core.about',
    label: 'About',
  });

  export const OPEN_PREFERENCES = Command.toDefaultLocalizedCommand({
    id: 'preferences:open',
    category: PREFERENCES_CATEGORY,
    label: 'Open Settings (UI)',
  });

  export const SELECT_COLOR_THEME = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.selectTheme',
    label: 'Color Theme',
    category: PREFERENCES_CATEGORY,
  });
  export const SELECT_ICON_THEME = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.selectIconTheme',
    label: 'File Icon Theme',
    category: PREFERENCES_CATEGORY,
  });

  export const CONFIGURE_DISPLAY_LANGUAGE = Command.toDefaultLocalizedCommand({
    id: 'workbench.action.configureLanguage',
    label: 'Configure Display Language',
  });

  export const TOGGLE_BREADCRUMBS = Command.toDefaultLocalizedCommand({
    id: 'breadcrumbs.toggle',
    label: 'Toggle Breadcrumbs',
    category: VIEW_CATEGORY,
  });
}

export class CommonApplicationContribution extends ApplicationContribution {
  constructor(
    @IShell protected readonly shell: IShell,
  ) {
    super();
  }

  override onApplicationInit() {
    this.shell.ready.then(() => {
      this.shell.leftPanelHandler.addBottomMenu({
        id: 'settings-menu',
        iconClass: codicon('settings-gear'),
        title: CommonCommands.MANAGE_CATEGORY,
        menuPath: MANAGE_MENU,
        order: 0,
      });
    });
  }
}

@Contribution(IMenuContribution)
export class CommonMenusContribution extends InjectableService implements IMenuContribution {
  registerMenus(_registry: MenuModelRegistry): void {
    // registry.registerSubmenu(CommonMenus.FILE, 'File');
    // registry.registerSubmenu(CommonMenus.EDIT, 'Edit');
    // registry.registerSubmenu(CommonMenus.VIEW, 'View');
    // registry.registerSubmenu(CommonMenus.HELP, 'Help');

    // // For plugins contributing create new file commands/menu-actions
    // registry.registerIndependentSubmenu(CommonMenus.FILE_NEW_CONTRIBUTIONS, 'New File...');

    // registry.registerMenuAction(CommonMenus.FILE_SAVE, {
    //   commandId: CommonCommands.SAVE.id,
    // });
    // registry.registerMenuAction(CommonMenus.FILE_SAVE, {
    //   commandId: CommonCommands.SAVE_ALL.id,
    // });

    // registry.registerMenuAction(CommonMenus.FILE_AUTOSAVE, {
    //   commandId: CommonCommands.AUTO_SAVE.id,
    // });

    // registry.registerSubmenu(CommonMenus.FILE_SETTINGS_SUBMENU, CommonCommands.PREFERENCES_CATEGORY);

    // registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
    //   commandId: CommonCommands.UNDO.id,
    //   order: '0',
    // });
    // registry.registerMenuAction(CommonMenus.EDIT_UNDO, {
    //   commandId: CommonCommands.REDO.id,
    //   order: '1',
    // });

    // registry.registerMenuAction(CommonMenus.EDIT_FIND, {
    //   commandId: CommonCommands.FIND.id,
    //   order: '0',
    // });
    // registry.registerMenuAction(CommonMenus.EDIT_FIND, {
    //   commandId: CommonCommands.REPLACE.id,
    //   order: '1',
    // });

    // registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
    //   commandId: CommonCommands.CUT.id,
    //   order: '0',
    // });
    // registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
    //   commandId: CommonCommands.COPY.id,
    //   order: '1',
    // });
    // registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
    //   commandId: CommonCommands.PASTE.id,
    //   order: '2',
    // });
    // registry.registerMenuAction(CommonMenus.EDIT_CLIPBOARD, {
    //   commandId: CommonCommands.COPY_PATH.id,
    //   order: '3',
    // });

    // registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
    //   commandId: CommonCommands.TOGGLE_BOTTOM_PANEL.id,
    //   order: '1',
    // });
    // registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
    //   commandId: CommonCommands.TOGGLE_STATUS_BAR.id,
    //   order: '2',
    //   label: 'Toggle Status Bar Visibility',
    // });
    // registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
    //   commandId: CommonCommands.COLLAPSE_ALL_PANELS.id,
    //   order: '3',
    // });

    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
    //   commandId: CommonCommands.CLOSE_TAB.id,
    //   label: 'Close',
    //   order: '0',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
    //   commandId: CommonCommands.CLOSE_OTHER_TABS.id,
    //   label: 'Close Others',
    //   order: '1',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
    //   commandId: CommonCommands.CLOSE_RIGHT_TABS.id,
    //   label: 'Close to the Right',
    //   order: '2',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
    //   commandId: CommonCommands.CLOSE_SAVED_TABS.id,
    //   label: 'Close Saved',
    //   order: '3',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_CLOSE, {
    //   commandId: CommonCommands.CLOSE_ALL_TABS.id,
    //   label: 'Close All',
    //   order: '4',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
    //   commandId: CommonCommands.COLLAPSE_PANEL.id,
    //   label: CommonCommands.COLLAPSE_PANEL.label,
    //   order: '5',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_SPLIT, {
    //   commandId: CommonCommands.TOGGLE_MAXIMIZED.id,
    //   label: CommonCommands.TOGGLE_MAXIMIZED.label,
    //   order: '6',
    // });
    // registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_SCREEN, {
    //   commandId: CommonCommands.TOGGLE_MAXIMIZED.id,
    //   label: CommonCommands.TOGGLE_MAXIMIZED.label,
    //   order: '6',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_COPY, {
    //   commandId: CommonCommands.COPY_PATH.id,
    //   label: CommonCommands.COPY_PATH.label,
    //   order: '1',
    // });
    // registry.registerMenuAction(CommonMenus.VIEW_APPEARANCE_SUBMENU_BAR, {
    //   commandId: CommonCommands.SHOW_MENU_BAR.id,
    //   label: 'Toggle Menu Bar',
    //   order: '0',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_PIN, {
    //   commandId: CommonCommands.PIN_TAB.id,
    //   label: 'Pin',
    //   order: '7',
    // });
    // registry.registerMenuAction(SHELL_TABBAR_CONTEXT_PIN, {
    //   commandId: CommonCommands.UNPIN_TAB.id,
    //   label: 'Unpin',
    //   order: '8',
    // });
    // registry.registerMenuAction(CommonMenus.HELP, {
    //   commandId: CommonCommands.ABOUT_COMMAND.id,
    //   label: CommonCommands.ABOUT_COMMAND.label,
    //   order: '9',
    // });

    // registry.registerMenuAction(CommonMenus.VIEW_PRIMARY, {
    //   commandId: CommonCommands.OPEN_VIEW.id,
    // });

    // registry.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_THEME, {
    //   commandId: CommonCommands.SELECT_COLOR_THEME.id,
    // });
    // registry.registerMenuAction(CommonMenus.FILE_SETTINGS_SUBMENU_THEME, {
    //   commandId: CommonCommands.SELECT_ICON_THEME.id,
    // });

    // registry.registerSubmenu(CommonMenus.MANAGE_SETTINGS_THEMES, 'Themes', { order: 'a50' });
    // registry.registerMenuAction(CommonMenus.MANAGE_SETTINGS_THEMES, {
    //   commandId: CommonCommands.SELECT_COLOR_THEME.id,
    //   order: '0',
    // });
    // registry.registerMenuAction(CommonMenus.MANAGE_SETTINGS_THEMES, {
    //   commandId: CommonCommands.SELECT_ICON_THEME.id,
    //   order: '1',
    // });

    // registry.registerSubmenu(CommonMenus.VIEW_APPEARANCE_SUBMENU, 'Appearance');

    // registry.registerMenuAction(CommonMenus.FILE_NEW_TEXT, {
    //   commandId: CommonCommands.NEW_UNTITLED_TEXT_FILE.id,
    //   label: 'New Text File',
    //   order: 'a',
    // });

    // registry.registerMenuAction(CommonMenus.FILE_NEW_TEXT, {
    //   commandId: CommonCommands.PICK_NEW_FILE.id,
    //   label: 'New File...',
    //   order: 'a1',
    // });
  }
}
