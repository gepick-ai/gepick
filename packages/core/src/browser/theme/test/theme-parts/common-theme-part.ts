import { Color } from "@gepick/core/common";
import { AbstractThemePart } from "../../theme-part-contribution";

export class CommonThemePart extends AbstractThemePart {
  constructor() {
    super([ // Base Colors should be aligned with https://code.visualstudio.com/api/references/theme-color#base-colors
      // if not yet contributed by Monaco, check runtime css variables to learn
      {
        id: 'selection.background',
        defaults: {
          dark: '#217daf',
          light: '#c0dbf1',
        },
        description: 'Overall border color for focused elements. This color is only used if not overridden by a component.',
      },
      {
        id: 'icon.foreground',
        defaults: {
          dark: '#C5C5C5',
          light: '#424242',
          hcDark: '#FFFFFF',
          hcLight: '#292929',
        },
        description: 'The default color for icons in the workbench.',
      },
      {
        id: 'sash.hoverBorder',
        defaults: {
          dark: Color.transparent('focusBorder', 0.99),
          light: Color.transparent('focusBorder', 0.99),
          hcDark: 'focusBorder',
          hcLight: 'focusBorder',
        },
        description: 'The hover border color for draggable sashes.',
      },
      {
        id: 'sash.activeBorder',
        defaults: {
          dark: 'focusBorder',
          light: 'focusBorder',
          hcDark: 'focusBorder',
        },
        description: 'The active border color for draggable sashes.',
      },
      // Window border colors should be aligned with https://code.visualstudio.com/api/references/theme-color#window-border
      {
        id: 'window.activeBorder',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'The color used for the border of the window when it is active.',
      },
      {
        id: 'window.inactiveBorder',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'The color used for the border of the window when it is inactive.',
      },

      // Buttons should be aligned with https://code.visualstudio.com/api/references/theme-color#button-control
      // if not yet contributed by Monaco, check runtime css variables to learn
      {
        id: 'button.foreground',
        defaults: {
          dark: Color.white,
          light: Color.white,
          hcDark: Color.white,
          hcLight: Color.white,
        },
        description: 'Button foreground color.',
      },
      {
        id: 'button.background',
        defaults: {
          dark: '#0E639C',
          light: '#007ACC',
          hcDark: undefined,
          hcLight: '#0F4A85',
        },
        description: 'Button background color.',
      },
      {
        id: 'button.hoverBackground',
        defaults: {
          dark: Color.lighten('button.background', 0.2),
          light: Color.darken('button.background', 0.2),
        },
        description: 'Button background color when hovering.',
      },
      // Activity Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#activity-bar
      {
        id: 'activityBar.background',
        defaults: {
          dark: '#333333',
          light: '#2C2C2C',
          hcDark: '#000000',
          hcLight: '#FFFFFF',
        },
        description: 'Activity bar background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.foreground',
        defaults: {
          dark: Color.white,
          light: Color.white,
          hcDark: Color.white,
          hcLight: 'editor.foreground',
        },
        description: 'Activity bar item foreground color when it is active. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.inactiveForeground',
        defaults: {
          dark: Color.transparent('activityBar.foreground', 0.4),
          light: Color.transparent('activityBar.foreground', 0.4),
          hcDark: Color.white,
          hcLight: 'editor.foreground',
        },
        description: 'Activity bar item foreground color when it is inactive. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.border',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Activity bar border color separating to the side bar. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.activeBorder',
        defaults: {
          dark: 'activityBar.foreground',
          light: 'activityBar.foreground',
          hcLight: 'contrastBorder',
        },
        description: 'Activity bar border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.activeFocusBorder',
        defaults: {
          hcLight: '#B5200D',
        },
        description: 'Activity bar focus border color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.activeBackground',
        description: 'Activity bar background color for the active item. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.dropBackground',
        defaults: {
          dark: Color.transparent('#ffffff', 0.12),
          light: Color.transparent('#ffffff', 0.12),
          hcDark: Color.transparent('#ffffff', 0.12),
        },
        description: 'Drag and drop feedback color for the activity bar items. The color should have transparency so that the activity bar entries can still shine through. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBarBadge.background',
        defaults: {
          dark: '#007ACC',
          light: '#007ACC',
          hcDark: '#000000',
          hcLight: '#0F4A85',
        },
        description: 'Activity notification badge background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBarBadge.foreground',
        defaults: {
          dark: Color.white,
          light: Color.white,
          hcDark: Color.white,
          hcLight: Color.white,
        },
        description: 'Activity notification badge foreground color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },

      // Side Bar should be aligned with https://code.visualstudio.com/api/references/theme-color#side-bar
      // if not yet contributed by Monaco, check runtime css variables to learn
      { id: 'sideBar.background', defaults: { dark: '#252526', light: '#F3F3F3', hcDark: '#000000', hcLight: '#FFFFFF' }, description: 'Side bar background color. The side bar is the container for views like explorer and search.' },
      { id: 'sideBar.foreground', description: 'Side bar foreground color. The side bar is the container for views like explorer and search.' },
      { id: 'sideBarSectionHeader.background', defaults: { dark: '#80808033', light: '#80808033' }, description: 'Side bar section header background color. The side bar is the container for views like explorer and search.' },
      { id: 'sideBarSectionHeader.foreground', description: 'Side bar foreground color. The side bar is the container for views like explorer and search.' },
      { id: 'sideBarSectionHeader.border', defaults: { dark: 'contrastBorder', light: 'contrastBorder', hcDark: 'contrastBorder', hcLight: 'contrastBorder' }, description: 'Side bar section header border color. The side bar is the container for views like explorer and search.' },

      // Lists and Trees colors should be aligned with https://code.visualstudio.com/api/references/theme-color#lists-and-trees
      // if not yet contributed by Monaco, check runtime css variables to learn.
      // TODO: Following are not yet supported/no respective elements in theia:
      // list.focusBackground, list.focusForeground, list.inactiveFocusBackground, list.filterMatchBorder,
      // list.dropBackground, listFilterWidget.outline, listFilterWidget.noMatchesOutline
      // list.invalidItemForeground => tree node needs an respective class
      {
        id: 'list.activeSelectionBackground',
        defaults: {
          dark: '#094771',
          light: '#0074E8',
          hcLight: Color.transparent('#0F4A85', 0.1),
        },
        description: 'List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.activeSelectionForeground',
        defaults: {
          dark: '#FFF',
          light: '#FFF',
        },
        description: 'List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.inactiveSelectionBackground',
        defaults: {
          dark: '#37373D',
          light: '#E4E6F1',
          hcLight: Color.transparent('#0F4A85', 0.1),
        },
        description: 'List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.inactiveSelectionForeground',
        description: 'List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.hoverBackground',
        defaults: {
          dark: '#2A2D2E',
          light: '#F0F0F0',
          hcLight: Color.transparent('#0F4A85', 0.1),
        },
        description: 'List/Tree background when hovering over items using the mouse.',
      },
      {
        id: 'list.hoverForeground',
        description: 'List/Tree foreground when hovering over items using the mouse.',
      },
      {
        id: 'list.errorForeground',
        defaults: {
          dark: '#F88070',
          light: '#B01011',
        },
        description: 'Foreground color of list items containing errors.',
      },
      {
        id: 'list.warningForeground',
        defaults: {
          dark: '#CCA700',
          light: '#855F00',
        },
        description: 'Foreground color of list items containing warnings.',
      },
      {
        id: 'list.filterMatchBackground',
        defaults: {
          dark: 'editor.findMatchHighlightBackground',
          light: 'editor.findMatchHighlightBackground',
        },
        description: 'Background color of the filtered match.',
      },
      {
        id: 'list.highlightForeground',
        defaults: {
          dark: '#18A3FF',
          light: '#0066BF',
          hcDark: 'focusBorder',
          hcLight: 'focusBorder',
        },
        description: 'List/Tree foreground color of the match highlights when searching inside the list/tree.',
      },
      {
        id: 'list.focusHighlightForeground',
        defaults: {
          dark: 'list.highlightForeground',
          light: 'list.activeSelectionForeground',
          hcDark: 'list.highlightForeground',
          hcLight: 'list.highlightForeground',
        },
        description: 'List/Tree foreground color of the match highlights on actively focused items when searching inside the list/tree.',
      },
      {
        id: 'tree.inactiveIndentGuidesStroke',
        defaults: {
          dark: Color.transparent('tree.indentGuidesStroke', 0.4),
          light: Color.transparent('tree.indentGuidesStroke', 0.4),
          hcDark: Color.transparent('tree.indentGuidesStroke', 0.4),
        },
        description: 'Tree stroke color for the inactive indentation guides.',
      },

      // Editor Group & Tabs colors should be aligned with https://code.visualstudio.com/api/references/theme-color#editor-groups-tabs
      {
        id: 'editorGroup.border',
        defaults: {
          dark: '#444444',
          light: '#E7E7E7',
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Color to separate multiple editor groups from each other. Editor groups are the containers of editors.',
      },
      {
        id: 'editorGroup.dropBackground',
        defaults: {
          dark: Color.transparent('#53595D', 0.5),
          light: Color.transparent('#2677CB', 0.18),
          hcLight: Color.transparent('#0F4A85', 0.50),
        },
        description: 'Background color when dragging editors around. The color should have transparency so that the editor contents can still shine through.',
      },
      {
        id: 'editorGroupHeader.tabsBackground',
        defaults: {
          dark: '#252526',
          light: '#F3F3F3',
        },
        description: 'Background color of the editor group title header when tabs are enabled. Editor groups are the containers of editors.',
      },
      {
        id: 'editorGroupHeader.tabsBorder',
        defaults: {
          hcDark: 'contrastBorder',
        },
        description: 'Border color of the editor group title header when tabs are enabled. Editor groups are the containers of editors.',
      },
      {
        id: 'tab.activeBackground',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hcDark: 'editor.background',
          hcLight: 'editor.background',
        },
        description: 'Active tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedActiveBackground',
        defaults: {
          dark: 'tab.activeBackground',
          light: 'tab.activeBackground',
          hcDark: 'tab.activeBackground',
          hcLight: 'tab.activeBackground',
        },
        description: 'Active tab background color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.inactiveBackground',
        defaults: {
          dark: '#2D2D2D',
          light: '#ECECEC',
        },
        description: 'Inactive tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.activeForeground',
        defaults: {
          dark: Color.white,
          light: '#333333',
          hcDark: Color.white,
          hcLight: '#292929',
        },
        description: 'Active tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.inactiveForeground',
        defaults: {
          dark: Color.transparent('tab.activeForeground', 0.5),
          light: Color.transparent('tab.activeForeground', 0.7),
          hcDark: Color.white,
          hcLight: '#292929',
        },
        description: 'Inactive tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedActiveForeground',
        defaults: {
          dark: Color.transparent('tab.activeForeground', 0.5),
          light: Color.transparent('tab.activeForeground', 0.7),
          hcDark: Color.white,
          hcLight: '#292929',
        },
        description: 'Active tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedInactiveForeground',
        defaults: {
          dark: Color.transparent('tab.inactiveForeground', 0.5),
          light: Color.transparent('tab.inactiveForeground', 0.5),
          hcDark: Color.white,
          hcLight: '#292929',
        },
        description: 'Inactive tab foreground color in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.border',
        defaults: {
          dark: '#252526',
          light: '#F3F3F3',
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Border to separate tabs from each other. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.activeBorder',
        description: 'Border on the bottom of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedActiveBorder',
        defaults: {
          dark: Color.transparent('tab.activeBorder', 0.5),
          light: Color.transparent('tab.activeBorder', 0.7),
        },
        description: 'Border on the bottom of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.activeBorderTop',
        defaults: {
          hcLight: '#B5200D',
        },
        description: 'Border to the top of an active tab. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedActiveBorderTop',
        defaults: {
          dark: Color.transparent('tab.activeBorderTop', 0.5),
          light: Color.transparent('tab.activeBorderTop', 0.7),
          hcLight: '#B5200D',
        },
        description: 'Border to the top of an active tab in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.hoverBackground',
        description: 'Tab background color when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedHoverBackground',
        defaults: {
          dark: Color.transparent('tab.hoverBackground', 0.5),
          light: Color.transparent('tab.hoverBackground', 0.7),
        },
        description: 'Tab background color in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.hoverBorder',
        description: 'Border to highlight tabs when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedHoverBorder',
        defaults: {
          dark: Color.transparent('tab.hoverBorder', 0.5),
          light: Color.transparent('tab.hoverBorder', 0.7),
          hcLight: 'contrastBorder',
        },
        description: 'Border to highlight tabs in an unfocused group when hovering. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.activeModifiedBorder',
        defaults: {
          dark: '#3399CC',
          light: '#33AAEE',
          hcLight: 'contrastBorder',
        },
        description: 'Border on the top of modified (dirty) active tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.inactiveModifiedBorder',
        defaults: {
          dark: Color.transparent('tab.activeModifiedBorder', 0.5),
          light: Color.transparent('tab.activeModifiedBorder', 0.5),
          hcDark: Color.white,
          hcLight: 'contrastBorder',
        },
        description: 'Border on the top of modified (dirty) inactive tabs in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedActiveModifiedBorder',
        defaults: {
          dark: Color.transparent('tab.activeModifiedBorder', 0.5),
          light: Color.transparent('tab.activeModifiedBorder', 0.7),
          hcDark: Color.white,
          hcLight: 'contrastBorder',
        },
        description: 'Border on the top of modified (dirty) active tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.unfocusedInactiveModifiedBorder',
        defaults: {
          dark: Color.transparent('tab.inactiveModifiedBorder', 0.5),
          light: Color.transparent('tab.inactiveModifiedBorder', 0.5),
          hcDark: Color.white,
          hcLight: 'contrastBorder',
        },
        description: 'Border on the top of modified (dirty) inactive tabs in an unfocused group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },

      // Status bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#status-bar-colors
      // Not yet supported:
      // statusBarItem.prominentForeground, statusBarItem.prominentBackground, statusBarItem.prominentHoverBackground
      {
        id: 'statusBar.foreground',
        defaults: {
          dark: '#FFFFFF',
          light: '#FFFFFF',
          hcDark: '#FFFFFF',
          hcLight: 'editor.foreground',
        },
        description: 'Status bar foreground color when a workspace is opened. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBar.background',
        defaults: {
          dark: '#007ACC',
          light: '#007ACC',
        },
        description: 'Status bar background color when a workspace is opened. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBar.noFolderForeground',
        defaults: {
          dark: 'statusBar.foreground',
          light: 'statusBar.foreground',
          hcDark: 'statusBar.foreground',
          hcLight: 'statusBar.foreground',
        },
        description: 'Status bar foreground color when no folder is opened. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBar.noFolderBackground',
        defaults: {
          dark: '#68217A',
          light: '#68217A',
        },
        description: 'Status bar background color when no folder is opened. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBar.border',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Status bar border color separating to the sidebar and editor. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBar.noFolderBorder',
        defaults: {
          dark: 'statusBar.border',
          light: 'statusBar.border',
          hcDark: 'statusBar.border',
          hcLight: 'statusBar.border',
        },
        description: 'Status bar border color separating to the sidebar and editor when no folder is opened. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBarItem.activeBackground',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.18),
          light: Color.rgba(255, 255, 255, 0.18),
          hcDark: Color.rgba(255, 255, 255, 0.18),
          hcLight: Color.rgba(0, 0, 0, 0.18),
        },
        description: 'Status bar item background color when clicking. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBarItem.hoverBackground',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.12),
          light: Color.rgba(255, 255, 255, 0.12),
          hcDark: Color.rgba(255, 255, 255, 0.12),
          hcLight: Color.rgba(0, 0, 0, 0.12),
        },
        description: 'Status bar item background color when hovering. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBarItem.errorBackground',
        defaults: {
          dark: Color.darken('errorBackground', 0.4),
          light: Color.darken('errorBackground', 0.4),
          hcDark: undefined,
          hcLight: '#B5200D',
        },
        description: 'Status bar error items background color. Error items stand out from other status bar entries to indicate error conditions. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBarItem.errorForeground',
        defaults: {
          dark: Color.white,
          light: Color.white,
          hcDark: Color.white,
          hcLight: Color.white,
        },
        description: 'Status bar error items foreground color. Error items stand out from other status bar entries to indicate error conditions. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBarItem.warningBackground',
        defaults: {
          dark: Color.darken('warningBackground', 0.4),
          light: Color.darken('warningBackground', 0.4),
          hcDark: undefined,
          hcLight: '#895503',
        },
        description: 'Status bar warning items background color. Warning items stand out from other status bar entries to indicate warning conditions. The status bar is shown in the bottom of the window.',
      },
      {
        id: 'statusBarItem.warningForeground',
        defaults: {
          dark: Color.white,
          light: Color.white,
          hcDark: Color.white,
          hcLight: Color.white,
        },
        description: 'Status bar warning items foreground color. Warning items stand out from other status bar entries to indicate warning conditions. The status bar is shown in the bottom of the window.',
      },

      // editor find

      {
        id: 'editor.findMatchBackground',
        defaults: {
          light: '#A8AC94',
          dark: '#515C6A',
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'Color of the current search match.',
      },

      {
        id: 'editor.findMatchForeground',
        defaults: {
          light: undefined,
          dark: undefined,
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'Text color of the current search match.',
      },
      {
        id: 'editor.findMatchHighlightBackground',
        defaults: {
          light: '#EA5C0055',
          dark: '#EA5C0055',
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'Color of the other search matches. The color must not be opaque so as not to hide underlying decorations.',
      },

      {
        id: 'editor.findMatchHighlightForeground',
        defaults: {
          light: undefined,
          dark: undefined,
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'Foreground color of the other search matches.',
      },

      {
        id: 'editor.findRangeHighlightBackground',
        defaults: {
          dark: '#3a3d4166',
          light: '#b4b4b44d',
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'Color of the range limiting the search. The color must not be opaque so as not to hide underlying decorations.',
      },

      {
        id: 'editor.findMatchBorder',
        defaults: {
          light: undefined,
          dark: undefined,
          hcDark: 'activeContrastBorder',
          hcLight: 'activeContrastBorder',
        },
        description: 'Border color of the current search match.',
      },
      {
        id: 'editor.findMatchHighlightBorder',
        defaults: {
          light: undefined,
          dark: undefined,
          hcDark: 'activeContrastBorder',
          hcLight: 'activeContrastBorder',
        },
        description: 'Border color of the other search matches.',
      },

      {
        id: 'editor.findRangeHighlightBorder',
        defaults: {
          dark: undefined,
          light: undefined,
          hcDark: Color.transparent('activeContrastBorder', 0.4),
          hcLight: Color.transparent('activeContrastBorder', 0.4),
        },
        description: 'Border color of the range limiting the search. The color must not be opaque so as not to hide underlying decorations.',
      },

      // Quickinput colors should be aligned with https://code.visualstudio.com/api/references/theme-color#quick-picker
      // if not yet contributed by Monaco, check runtime css variables to learn.
      {
        id: 'quickInput.background',
        defaults: {
          dark: 'editorWidget.background',
          light: 'editorWidget.background',
          hcDark: 'editorWidget.background',
          hcLight: 'editorWidget.background',
        },
        description: 'Quick Input background color. The Quick Input widget is the container for views like the color theme picker.',
      },
      {
        id: 'quickInput.foreground',
        defaults: {
          dark: 'editorWidget.foreground',
          light: 'editorWidget.foreground',
          hcDark: 'editorWidget.foreground',
          hcLight: 'editorWidget.foreground',
        },
        description: 'Quick Input foreground color. The Quick Input widget is the container for views like the color theme picker.',
      },
      {
        id: 'quickInput.list.focusBackground',
        defaults: {
          dark: undefined,
          light: undefined,
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'quickInput.list.focusBackground deprecation. Please use quickInputList.focusBackground instead',
      },
      {
        id: 'quickInputList.focusForeground',
        defaults: {
          dark: 'list.activeSelectionForeground',
          light: 'list.activeSelectionForeground',
          hcDark: 'list.activeSelectionForeground',
          hcLight: 'list.activeSelectionForeground',
        },
        description: 'Quick picker foreground color for the focused item',
      },
      {
        id: 'quickInputList.focusBackground',
        defaults: {
          dark: 'list.activeSelectionBackground',
          light: 'list.activeSelectionBackground',
          hcDark: undefined,
        },
        description: 'Quick picker background color for the focused item.',
      },

      // Panel colors should be aligned with https://code.visualstudio.com/api/references/theme-color#panel-colors
      {
        id: 'panel.background',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hcDark: 'editor.background',
          hcLight: 'editor.background',
        },
        description: 'Panel background color. Panels are shown below the editor area and contain views like output and integrated terminal.',
      },
      {
        id: 'panel.border',
        defaults: {
          dark: Color.transparent('#808080', 0.35),
          light: Color.transparent('#808080', 0.35),
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Panel border color to separate the panel from the editor. Panels are shown below the editor area and contain views like output and integrated terminal.',
      },
      {
        id: 'panel.dropBackground',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.12),
          light: Color.transparent('#2677CB', 0.18),
          hcDark: Color.rgba(255, 255, 255, 0.12),
        },
        description: 'Drag and drop feedback color for the panel title items. The color should have transparency so that the panel entries can still shine through. Panels are shown below the editor area and contain views like output and integrated terminal.',
      },
      {
        id: 'panelTitle.activeForeground',
        defaults: {
          dark: '#E7E7E7',
          light: '#424242',
          hcDark: Color.white,
          hcLight: 'editor.foreground',
        },
        description: 'Title color for the active panel. Panels are shown below the editor area and contain views like output and integrated terminal.',
      },
      {
        id: 'panelTitle.inactiveForeground',
        defaults: {
          dark: Color.transparent('panelTitle.activeForeground', 0.6),
          light: Color.transparent('panelTitle.activeForeground', 0.75),
          hcDark: Color.white,
          hcLight: 'editor.foreground',
        },
        description: 'Title color for the inactive panel. Panels are shown below the editor area and contain views like output and integrated terminal.',
      },
      {
        id: 'panelTitle.activeBorder',
        defaults: {
          dark: 'panelTitle.activeForeground',
          light: 'panelTitle.activeForeground',
          hcDark: 'contrastBorder',
          hcLight: '#B5200D',
        },
        description: 'Border color for the active panel title. Panels are shown below the editor area and contain views like output and integrated terminal.',
      },
      {
        id: 'panelInput.border',
        defaults: { light: '#ddd' },
        description: 'Input box border for inputs in the panel.',
      },
      {
        id: 'imagePreview.border',
        defaults: {
          dark: Color.transparent('#808080', 0.35),
          light: Color.transparent('#808080', 0.35),
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Border color for image in image preview.',
      },

      // Title Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#title-bar-colors
      {
        id: 'titleBar.activeForeground',
        defaults: {
          dark: '#CCCCCC',
          light: '#333333',
          hcDark: '#FFFFFF',
          hcLight: '#292929',
        },
        description: 'Title bar foreground when the window is active. Note that this color is currently only supported on macOS.',
      },
      {
        id: 'titleBar.inactiveForeground',
        defaults: {
          dark: Color.transparent('titleBar.activeForeground', 0.6),
          light: Color.transparent('titleBar.activeForeground', 0.6),
          hcLight: '#292929',
        },
        description: 'Title bar foreground when the window is inactive. Note that this color is currently only supported on macOS.',
      },
      {
        id: 'titleBar.activeBackground',
        defaults: {
          dark: '#3C3C3C',
          light: '#DDDDDD',
          hcDark: '#000000',
          hcLight: '#FFFFFF',
        },
        description: 'Title bar background when the window is active. Note that this color is currently only supported on macOS.',
      },
      {
        id: 'titleBar.inactiveBackground',
        defaults: {
          dark: Color.transparent('titleBar.activeBackground', 0.6),
          light: Color.transparent('titleBar.activeBackground', 0.6),
        },
        description: 'Title bar background when the window is inactive. Note that this color is currently only supported on macOS.',
      },
      {
        id: 'titleBar.border',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Title bar border color. Note that this color is currently only supported on macOS.',
      },

      // Menu Bar colors should be aligned with https://code.visualstudio.com/api/references/theme-color#menu-bar-colors
      {
        id: 'menubar.selectionForeground',
        defaults: {
          dark: 'titleBar.activeForeground',
          light: 'titleBar.activeForeground',
          hcDark: 'titleBar.activeForeground',
          hcLight: 'titleBar.activeForeground',
        },
        description: 'Foreground color of the selected menu item in the menubar.',
      },
      {
        id: 'menubar.selectionBackground',
        defaults: {
          dark: 'toolbar.hoverBackground',
          light: 'toolbar.hoverBackground',
        },
        description: 'Background color of the selected menu item in the menubar.',
      },
      {
        id: 'menubar.selectionBorder',
        defaults: {
          hcDark: 'activeContrastBorder',
          hcLight: 'activeContrastBorder',
        },
        description: 'Border color of the selected menu item in the menubar.',
      },
      {
        id: 'menu.border',
        defaults: {
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Border color of menus.',
      },
      {
        id: 'menu.foreground',
        defaults: {
          dark: 'dropdown.foreground',
          light: 'foreground',
          hcDark: 'dropdown.foreground',
          hcLight: 'dropdown.foreground',
        },
        description: 'Foreground color of menu items.',
      },
      {
        id: 'menu.background',
        defaults: {
          dark: 'dropdown.background',
          light: 'dropdown.background',
          hcDark: 'dropdown.background',
          hcLight: 'dropdown.background',
        },
        description: 'Background color of menu items.',
      },
      {
        id: 'menu.selectionForeground',
        defaults: {
          dark: 'list.activeSelectionForeground',
          light: 'list.activeSelectionForeground',
          hcDark: 'list.activeSelectionForeground',
          hcLight: 'list.activeSelectionForeground',
        },
        description: 'Foreground color of the selected menu item in menus.',
      },
      {
        id: 'menu.selectionBackground',
        defaults: {
          dark: 'list.activeSelectionBackground',
          light: 'list.activeSelectionBackground',
          hcDark: 'list.activeSelectionBackground',
          hcLight: 'list.activeSelectionBackground',
        },
        description: 'Background color of the selected menu item in menus.',
      },
      {
        id: 'menu.selectionBorder',
        defaults: {
          hcDark: 'activeContrastBorder',
          hcLight: 'activeContrastBorder',
        },
        description: 'Border color of the selected menu item in menus.',
      },
      {
        id: 'menu.separatorBackground',
        defaults: {
          dark: '#BBBBBB',
          light: '#888888',
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Color of a separator menu item in menus.',
      },

      // Welcome Page colors should be aligned with https://code.visualstudio.com/api/references/theme-color#welcome-page
      { id: 'welcomePage.background', description: 'Background color for the Welcome page.' },
      { id: 'welcomePage.buttonBackground', defaults: { dark: Color.rgba(0, 0, 0, 0.2), light: Color.rgba(0, 0, 0, 0.04), hcDark: Color.black, hcLight: Color.white }, description: 'Background color for the buttons on the Welcome page.' },
      { id: 'welcomePage.buttonHoverBackground', defaults: { dark: Color.rgba(200, 235, 255, 0.072), light: Color.rgba(0, 0, 0, 0.10) }, description: 'Hover background color for the buttons on the Welcome page.' },
      { id: 'walkThrough.embeddedEditorBackground', defaults: { dark: Color.rgba(0, 0, 0, 0.4), light: '#f4f4f4' }, description: 'Background color for the embedded editors on the Interactive Playground.' },

      // Dropdown colors should be aligned with https://code.visualstudio.com/api/references/theme-color#dropdown-control

      {
        id: 'dropdown.background',
        defaults: {
          light: Color.white,
          dark: '#3C3C3C',
          hcDark: Color.black,
          hcLight: Color.white,
        },
        description: 'Dropdown background.',
      },
      {
        id: 'dropdown.listBackground',
        defaults: {
          hcDark: Color.black,
          hcLight: Color.white,
        },
        description: 'Dropdown list background.',
      },
      {
        id: 'dropdown.foreground',
        defaults: {
          dark: '#F0F0F0',
          hcDark: Color.white,
          hcLight: 'foreground',
        },
        description: 'Dropdown foreground.',
      },
      {
        id: 'dropdown.border',
        defaults: {
          light: '#CECECE',
          dark: 'dropdown.background',
          hcDark: 'contrastBorder',
          hcLight: 'contrastBorder',
        },
        description: 'Dropdown border.',
      },

      // Settings Editor colors should be aligned with https://code.visualstudio.com/api/references/theme-color#settings-editor-colors
      {
        id: 'settings.headerForeground',
        defaults: {
          light: '#444444',
          dark: '#e7e7e7',
          hcDark: '#ffffff',
          hcLight: '#292929',
        },
        description: 'The foreground color for a section header or active title.',
      },
      {
        id: 'settings.modifiedItemIndicator',
        defaults: {
          light: Color.rgba(102, 175, 224),
          dark: Color.rgba(12, 125, 157),
          hcDark: Color.rgba(0, 73, 122),
          hcLight: Color.rgba(102, 175, 224),
        },
        description: 'The color of the modified setting indicator.',
      },
      {
        id: 'settings.dropdownBackground',
        defaults: {
          dark: 'dropdown.background',
          light: 'dropdown.background',
          hcDark: 'dropdown.background',
          hcLight: 'dropdown.background',
        },
        description: 'Settings editor dropdown background.',
      },
      {
        id: 'settings.dropdownForeground',
        defaults: {
          dark: 'dropdown.foreground',
          light: 'dropdown.foreground',
          hcDark: 'dropdown.foreground',
          hcLight: 'dropdown.foreground',
        },
        description: 'Settings editor dropdown foreground.',
      },
      {
        id: 'settings.dropdownBorder',
        defaults: {
          dark: 'dropdown.border',
          light: 'dropdown.border',
          hcDark: 'dropdown.border',
          hcLight: 'dropdown.border',
        },
        description: 'Settings editor dropdown border.',
      },
      {
        id: 'settings.dropdownListBorder',
        defaults: {
          dark: 'editorWidget.border',
          light: 'editorWidget.border',
          hcDark: 'editorWidget.border',
          hcLight: 'editorWidget.border',
        },
        description: 'Settings editor dropdown list border. This surrounds the options and separates the options from the description.',
      },
      {
        id: 'settings.checkboxBackground',
        defaults: {
          dark: 'checkbox.background',
          light: 'checkbox.background',
          hcDark: 'checkbox.background',
          hcLight: 'checkbox.background',
        },
        description: 'Settings editor checkbox background.',
      },
      {
        id: 'settings.checkboxForeground',
        defaults: {
          dark: 'checkbox.foreground',
          light: 'checkbox.foreground',
          hcDark: 'checkbox.foreground',
          hcLight: 'checkbox.foreground',
        },
        description: 'Settings editor checkbox foreground.',
      },
      {
        id: 'settings.checkboxBorder',
        defaults: {
          dark: 'checkbox.border',
          light: 'checkbox.border',
          hcDark: 'checkbox.border',
          hcLight: 'checkbox.border',
        },
        description: 'Settings editor checkbox border.',
      },
      {
        id: 'settings.textInputBackground',
        defaults: {
          dark: 'input.background',
          light: 'input.background',
          hcDark: 'input.background',
          hcLight: 'input.background',
        },
        description: 'Settings editor text input box background.',
      },
      {
        id: 'settings.textInputForeground',
        defaults: {
          dark: 'input.foreground',
          light: 'input.foreground',
          hcDark: 'input.foreground',
          hcLight: 'input.foreground',
        },
        description: 'Settings editor text input box foreground.',
      },
      {
        id: 'settings.textInputBorder',
        defaults: {
          dark: 'input.border',
          light: 'input.border',
          hcDark: 'input.border',
          hcLight: 'input.background',
        },
        description: 'Settings editor text input box border.',
      },
      {
        id: 'settings.numberInputBackground',
        defaults: {
          dark: 'input.background',
          light: 'input.background',
          hcDark: 'input.background',
          hcLight: 'input.background',
        },
        description: 'Settings editor number input box background.',
      },
      {
        id: 'settings.numberInputForeground',
        defaults: {
          dark: 'input.foreground',
          light: 'input.foreground',
          hcDark: 'input.foreground',
          hcLight: 'input.foreground',
        },
        description: 'Settings editor number input box foreground.',
      },
      {
        id: 'settings.numberInputBorder',
        defaults: {
          dark: 'input.border',
          light: 'input.border',
          hcDark: 'input.border',
          hcLight: 'input.border',
        },
        description: 'Settings editor number input box border.',
      },
      {
        id: 'settings.focusedRowBackground',
        defaults: {
          dark: Color.transparent('#808080', 0.14),
          light: Color.transparent('#808080', 0.03),
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'The background color of a settings row when focused.',
      },
      {
        id: 'settings.rowHoverBackground',
        defaults: {
          dark: Color.transparent('#808080', 0.07),
          light: Color.transparent('#808080', 0.05),
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'The background color of a settings row when hovered.',
      },
      {
        id: 'settings.focusedRowBorder',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.12),
          light: Color.rgba(0, 0, 0, 0.12),
          hcDark: 'focusBorder',
          hcLight: 'focusBorder',
        },
        description: "The color of the row's top and bottom border when the row is focused.",
      },
      // Toolbar Action colors should be aligned with https://code.visualstudio.com/api/references/theme-color#action-colors
      {
        id: 'toolbar.hoverBackground',
        defaults: {
          dark: '#5a5d5e50',
          light: '#b8b8b850',
          hcDark: undefined,
          hcLight: undefined,
        },
        description: 'Toolbar background when hovering over actions using the mouse.',
      },

      // Theia Variable colors
      {
        id: 'variable.name.color',
        defaults: {
          dark: '#C586C0',
          light: '#9B46B0',
          hcDark: '#C586C0',
        },
        description: 'Color of a variable name.',
      },
      {
        id: 'variable.value.color',
        defaults: {
          dark: Color.rgba(204, 204, 204, 0.6),
          light: Color.rgba(108, 108, 108, 0.8),
          hcDark: Color.rgba(204, 204, 204, 0.6),
        },
        description: 'Color of a variable value.',
      },
      {
        id: 'variable.number.variable.color',
        defaults: {
          dark: '#B5CEA8',
          light: '#09885A',
          hcDark: '#B5CEA8',
        },
        description: 'Value color of a number variable',
      },
      {
        id: 'variable.boolean.variable.color',
        defaults: {
          dark: '#4E94CE',
          light: '#0000FF',
          hcDark: '#4E94CE',
        },
        description: 'Value color of a boolean variable',
      },
      {
        id: 'variable.string.variable.color',
        defaults: {
          dark: '#CE9178',
          light: '#A31515',
          hcDark: '#CE9178',
        },
        description: 'Value color of a string variable',
      },

      // Theia ANSI colors
      {
        id: 'ansi.black.color',
        defaults: {
          dark: '#A0A0A0',
          light: Color.rgba(128, 128, 128),
          hcDark: '#A0A0A0',
        },
        description: 'ANSI black color',
      },
      {
        id: 'ansi.red.color',
        defaults: {
          dark: '#A74747',
          light: '#BE1717',
          hcDark: '#A74747',
        },
        description: 'ANSI red color',
      },
      {
        id: 'ansi.green.color',
        defaults: {
          dark: '#348F34',
          light: '#338A2F',
          hcDark: '#348F34',
        },
        description: 'ANSI green color',
      },
      {
        id: 'ansi.yellow.color',
        defaults: {
          dark: '#5F4C29',
          light: '#BEB817',
          hcDark: '#5F4C29',
        },
        description: 'ANSI yellow color',
      },
      {
        id: 'ansi.blue.color',
        defaults: {
          dark: '#6286BB',
          light: Color.rgba(0, 0, 139),
          hcDark: '#6286BB',
        },
        description: 'ANSI blue color',
      },
      {
        id: 'ansi.magenta.color',
        defaults: {
          dark: '#914191',
          light: Color.rgba(139, 0, 139),
          hcDark: '#914191',
        },
        description: 'ANSI magenta color',
      },
      {
        id: 'ansi.cyan.color',
        defaults: {
          dark: '#218D8D',
          light: Color.rgba(0, 139, 139),
          hcDark: '#218D8D',
        },
        description: 'ANSI cyan color',
      },
      {
        id: 'ansi.white.color',
        defaults: {
          dark: '#707070',
          light: '#BDBDBD',
          hcDark: '#707070',
        },
        description: 'ANSI white color',
      },

      // Theia defaults
      // Base
      {
        id: 'errorBackground',
        defaults: {
          dark: 'inputValidation.errorBackground',
          light: 'inputValidation.errorBackground',
          hcDark: 'inputValidation.errorBackground',
        },
        description: 'Background color of error widgets (like alerts or notifications).',
      },
      {
        id: 'successBackground',
        defaults: {
          dark: 'editorGutter.addedBackground',
          light: 'editorGutter.addedBackground',
          hcDark: 'editorGutter.addedBackground',
        },
        description: 'Background color of success widgets (like alerts or notifications).',
      },
      {
        id: 'warningBackground',
        defaults: {
          dark: 'editorWarning.foreground',
          light: 'editorWarning.foreground',
          hcDark: 'editorWarning.border',
        },
        description: 'Background color of warning widgets (like alerts or notifications).',
      },
      {
        id: 'warningForeground',
        defaults: {
          dark: 'inputValidation.warningBackground',
          light: 'inputValidation.warningBackground',
          hcDark: 'inputValidation.warningBackground',
        },
        description: 'Foreground color of warning widgets (like alerts or notifications).',
      },
      // Statusbar
      {
        id: 'statusBar.offlineBackground',
        defaults: {
          dark: 'editorWarning.foreground',
          light: 'editorWarning.foreground',
          hcDark: 'editorWarning.foreground',
          hcLight: 'editorWarning.foreground',
        },
        description: 'Background of hovered statusbar item in case the theia server is offline.',
      },
      {
        id: 'statusBar.offlineForeground',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hcDark: 'editor.background',
          hcLight: 'editor.background',
        },
        description: 'Background of hovered statusbar item in case the theia server is offline.',
      },
      {
        id: 'statusBarItem.offlineHoverBackground',
        defaults: {
          dark: Color.lighten('statusBar.offlineBackground', 0.4),
          light: Color.lighten('statusBar.offlineBackground', 0.4),
          hcDark: Color.lighten('statusBar.offlineBackground', 0.4),
          hcLight: Color.lighten('statusBar.offlineBackground', 0.4),
        },
        description: 'Background of hovered statusbar item in case the theia server is offline.',
      },
      {
        id: 'statusBarItem.offlineActiveBackground',
        defaults: {
          dark: Color.lighten('statusBar.offlineBackground', 0.6),
          light: Color.lighten('statusBar.offlineBackground', 0.6),
          hcDark: Color.lighten('statusBar.offlineBackground', 0.6),
          hcLight: Color.lighten('statusBar.offlineBackground', 0.6),
        },
        description: 'Background of active statusbar item in case the theia server is offline.',
      },
      {
        id: 'statusBarItem.remoteBackground',
        defaults: {
          dark: 'activityBarBadge.background',
          light: 'activityBarBadge.background',
          hcDark: 'activityBarBadge.background',
          hcLight: 'activityBarBadge.background',
        },
        description: 'Background color for the remote indicator on the status bar.',
      },
      {
        id: 'statusBarItem.remoteForeground',
        defaults: {
          dark: 'activityBarBadge.foreground',
          light: 'activityBarBadge.foreground',
          hcDark: 'activityBarBadge.foreground',
          hcLight: 'activityBarBadge.foreground',
        },
        description: 'Foreground color for the remote indicator on the status bar.',
      },
      // Buttons
      {
        id: 'secondaryButton.foreground',
        defaults: {
          dark: 'dropdown.foreground',
          light: 'dropdown.foreground',
          hcDark: 'dropdown.foreground',
          hcLight: 'dropdown.foreground',
        },
        description: 'Foreground color of secondary buttons.',
      },
      {
        id: 'secondaryButton.disabledForeground',
        defaults: {
          dark: Color.transparent('secondaryButton.foreground', 0.5),
          light: Color.transparent('secondaryButton.foreground', 0.5),
          hcDark: Color.transparent('secondaryButton.foreground', 0.5),
          hcLight: Color.transparent('secondaryButton.foreground', 0.5),
        },
        description: 'Foreground color of secondary buttons.',
      },
      {
        id: 'secondaryButton.background',
        defaults: {
          dark: Color.lighten('dropdown.background', 0.5),
          light: Color.lighten('dropdown.background', 0.5),
        },
        description: 'Background color of secondary buttons.',
      },
      {
        id: 'secondaryButton.hoverBackground',
        defaults: {
          dark: Color.lighten('secondaryButton.background', 0.2),
          light: Color.lighten('secondaryButton.background', 0.2),
        },
        description: 'Background color when hovering secondary buttons.',
      },
      {
        id: 'secondaryButton.disabledBackground',
        defaults: {
          dark: Color.transparent('secondaryButton.background', 0.6),
          light: Color.transparent('secondaryButton.background', 0.6),
        },
        description: 'Background color when hovering secondary buttons.',
      },
      {
        id: 'button.disabledForeground',
        defaults: {
          dark: Color.transparent('button.foreground', 0.5),
          light: Color.transparent('button.foreground', 0.5),
          hcDark: Color.transparent('button.foreground', 0.5),
        },
        description: 'Foreground color of secondary buttons.',
      },
      {
        id: 'button.disabledBackground',
        defaults: {
          dark: Color.transparent('button.background', 0.5),
          light: Color.transparent('button.background', 0.5),
        },
        description: 'Background color of secondary buttons.',
      },
      {
        id: 'editorGutter.commentRangeForeground',
        defaults: {
          dark: '#c5c5c5',
          light: '#c5c5c5',
          hcDark: Color.white,
          hcLight: Color.white,
        },
        description: 'Editor gutter decoration color for commenting ranges.',
      },
      {
        id: 'breadcrumb.foreground',
        defaults: {
          dark: Color.transparent('foreground', 0.8),
          light: Color.transparent('foreground', 0.8),
          hcDark: Color.transparent('foreground', 0.8),
          hcLight: Color.transparent('foreground', 0.8),
        },
        description: 'Color of breadcrumb item text',
      },
      {
        id: 'breadcrumb.background',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hcDark: 'editor.background',
          hcLight: 'editor.background',
        },
        description: 'Color of breadcrumb item background',
      },
      {
        id: 'breadcrumb.focusForeground',
        defaults: {
          dark: Color.lighten('foreground', 0.1),
          light: Color.darken('foreground', 0.2),
          hcDark: Color.lighten('foreground', 0.1),
          hcLight: Color.lighten('foreground', 0.1),
        },
        description: 'Color of breadcrumb item text when focused',
      },
      {
        id: 'breadcrumb.activeSelectionForeground',
        defaults: {
          dark: Color.lighten('foreground', 0.1),
          light: Color.darken('foreground', 0.2),
          hcDark: Color.lighten('foreground', 0.1),
          hcLight: Color.lighten('foreground', 0.1),
        },
        description: 'Color of selected breadcrumb item',
      },
      {
        id: 'breadcrumbPicker.background',
        defaults: {
          dark: 'editorWidget.background',
          light: 'editorWidget.background',
          hcDark: 'editorWidget.background',
          hcLight: 'editorWidget.background',
        },
        description: 'Background color of breadcrumb item picker',
      },
      {
        id: 'mainToolbar.background',
        defaults: {
          dark: Color.lighten('activityBar.background', 0.1),
          light: Color.darken('activityBar.background', 0.1),
          hcDark: Color.lighten('activityBar.background', 0.1),
          hcLight: Color.lighten('activityBar.background', 0.1),
        },
        description: 'Background color of shell\'s global toolbar',
      },
      {
        id: 'mainToolbar.foreground',
        defaults: {
          dark: Color.darken('activityBar.foreground', 0.1),
          light: Color.lighten('activityBar.foreground', 0.1),
          hcDark: Color.lighten('activityBar.foreground', 0.1),
          hcLight: Color.lighten('activityBar.foreground', 0.1),
        },
        description: 'Foreground color of active toolbar item',
      },
      {
        id: 'editorHoverWidgetInternalBorder',
        defaults: {
          dark: Color.transparent('editorHoverWidget.border', 0.5),
          light: Color.transparent('editorHoverWidget.border', 0.5),
          hcDark: Color.transparent('editorHoverWidget.border', 0.5),
          hcLight: Color.transparent('editorHoverWidget.border', 0.5),
        },
        description: 'The border between subelements of a hover widget',
      },
    ]);
  }
}
