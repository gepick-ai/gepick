import { AbstractThemePart } from "../theme-part-contribution";

export class DebugThemePart extends AbstractThemePart {
  constructor() {
    super([ // Debug colors should be aligned with https://code.visualstudio.com/api/references/theme-color#debug-colors
      {
        id: 'editor.stackFrameHighlightBackground',
        defaults: {
          dark: '#ffff0033',
          light: '#ffff6673',
          hcDark: '#fff600',
          hcLight: '#ffff6673',
        },
        description: 'Background color for the highlight of line at the top stack frame position.',
      },
      {
        id: 'editor.focusedStackFrameHighlightBackground',
        defaults: {
          dark: '#7abd7a4d',
          light: '#cee7ce73',
          hcDark: '#cee7ce',
          hcLight: '#cee7ce73',
        },
        description: 'Background color for the highlight of line at focused stack frame position.',
      },
      // Status bar colors should be aligned with debugging colors from https://code.visualstudio.com/api/references/theme-color#status-bar-colors
      {
        id: 'statusBar.debuggingBackground',
        defaults: {
          dark: '#CC6633',
          light: '#CC6633',
          hcDark: '#CC6633',
          hcLight: '#B5200D',
        },
        description: 'Status bar background color when a program is being debugged. The status bar is shown in the bottom of the window',
      },
      {
        id: 'statusBar.debuggingForeground',
        defaults: {
          dark: 'statusBar.foreground',
          light: 'statusBar.foreground',
          hcDark: 'statusBar.foreground',
          hcLight: 'statusBar.foreground',
        },
        description: 'Status bar foreground color when a program is being debugged. The status bar is shown in the bottom of the window',
      },
      {
        id: 'statusBar.debuggingBorder',
        defaults: {
          dark: 'statusBar.border',
          light: 'statusBar.border',
          hcDark: 'statusBar.border',
          hcLight: 'statusBar.border',
        },
        description: 'Status bar border color separating to the sidebar and editor when a program is being debugged. The status bar is shown in the bottom of the window',
      },
      // Debug Exception Widget colors should be aligned with
      // https://github.com/microsoft/vscode/blob/ff5f581425da6230b6f9216ecf19abf6c9d285a6/src/vs/workbench/contrib/debug/browser/exceptionWidget.ts#L23
      {
        id: 'debugExceptionWidget.border',
        defaults: {
          dark: '#a31515',
          light: '#a31515',
          hcDark: '#a31515',
          hcLight: '#a31515',
        },
        description: 'Exception widget border color.',
      },
      {
        id: 'debugExceptionWidget.background',
        defaults: {
          dark: '#420b0d',
          light: '#f1dfde',
          hcDark: '#420b0d',
          hcLight: '#f1dfde',
        },
        description: 'Exception widget background color.',
      },
      // Debug Icon colors should be aligned with
      // https://code.visualstudio.com/api/references/theme-color#debug-icons-colors
      {
        id: 'debugIcon.breakpointForeground',
        defaults: {
          dark: '#E51400',
          light: '#E51400',
          hcDark: '#E51400',
          hcLight: '#E51400',
        },
        description: 'Icon color for breakpoints.',
      },
      {
        id: 'debugIcon.breakpointDisabledForeground',
        defaults: {
          dark: '#848484',
          light: '#848484',
          hcDark: '#848484',
          hcLight: '#848484',
        },
        description: 'Icon color for disabled breakpoints.',
      },
      {
        id: 'debugIcon.breakpointUnverifiedForeground',
        defaults: {
          dark: '#848484',
          light: '#848484',
          hcDark: '#848484',
          hcLight: '#848484',
        },
        description: 'Icon color for unverified breakpoints.',
      },
      {
        id: 'debugIcon.breakpointCurrentStackframeForeground',
        defaults: {
          dark: '#FFCC00',
          light: '#BE8700',
          hcDark: '#FFCC00',
          hcLight: '#BE8700',
        },
        description: 'Icon color for the current breakpoint stack frame.',
      },
      {
        id: 'debugIcon.breakpointStackframeForeground',
        defaults: {
          dark: '#89D185',
          light: '#89D185',
          hcDark: '#89D185',
          hcLight: '#89D185',
        },
        description: 'Icon color for all breakpoint stack frames.',
      },
      {
        id: 'debugIcon.startForeground',
        defaults: {
          dark: '#89D185',
          light: '#388A34',
          hcDark: '#89D185',
          hcLight: '#388A34',
        },
        description: 'Debug toolbar icon for start debugging.',
      },
      {
        id: 'debugIcon.pauseForeground',
        defaults: {
          dark: '#75BEFF',
          light: '#007ACC',
          hcDark: '#75BEFF',
          hcLight: '#007ACC',
        },
        description: 'Debug toolbar icon for pause.',
      },
      {
        id: 'debugIcon.stopForeground',
        defaults: {
          dark: '#F48771',
          light: '#A1260D',
          hcDark: '#F48771',
          hcLight: '#A1260D',
        },
        description: 'Debug toolbar icon for stop.',
      },
      {
        id: 'debugIcon.disconnectForeground',
        defaults: {
          dark: '#F48771',
          light: '#A1260D',
          hcDark: '#F48771',
          hcLight: '#A1260D',
        },
        description: 'Debug toolbar icon for disconnect.',
      },
      {
        id: 'debugIcon.restartForeground',
        defaults: {
          dark: '#89D185',
          light: '#388A34',
          hcDark: '#89D185',
          hcLight: '#388A34',
        },
        description: 'Debug toolbar icon for restart.',
      },
      {
        id: 'debugIcon.stepOverForeground',
        defaults: {
          dark: '#75BEFF',
          light: '#007ACC',
          hcDark: '#75BEFF',
          hcLight: '#007ACC',
        },
        description: 'Debug toolbar icon for step over.',
      },
      {
        id: 'debugIcon.stepIntoForeground',
        defaults: {
          dark: '#75BEFF',
          light: '#007ACC',
          hcDark: '#75BEFF',
          hcLight: '#007ACC',
        },
        description: 'Debug toolbar icon for step into.',
      },
      {
        id: 'debugIcon.stepOutForeground',
        defaults: {
          dark: '#75BEFF',
          light: '#007ACC',
          hcDark: '#75BEFF',
          hcLight: '#007ACC',
        },
        description: 'Debug toolbar icon for step over.',
      },
      {
        id: 'debugIcon.continueForeground',
        defaults: {
          dark: '#75BEFF',
          light: '#007ACC',
          hcDark: '#75BEFF',
          hcLight: '#007ACC',
        },
        description: 'Debug toolbar icon for continue.',
      },
      {
        id: 'debugIcon.stepBackForeground',
        defaults: {
          dark: '#75BEFF',
          light: '#007ACC',
          hcDark: '#75BEFF',
          hcLight: '#007ACC',
        },
        description: 'Debug toolbar icon for step back.',
      },
      {
        id: 'debugConsole.infoForeground',
        defaults: {
          dark: 'editorInfo.foreground',
          light: 'editorInfo.foreground',
          hcDark: 'foreground',
          hcLight: 'foreground',
        },
        description: 'Foreground color for info messages in debug REPL console.',
      },
      {
        id: 'debugConsole.warningForeground',
        defaults: {
          dark: 'editorWarning.foreground',
          light: 'editorWarning.foreground',
          hcDark: '#008000',
          hcLight: 'editorWarning.foreground',
        },
        description: 'Foreground color for warning messages in debug REPL console.',
      },
      {
        id: 'debugConsole.errorForeground',
        defaults: {
          dark: 'errorForeground',
          light: 'errorForeground',
          hcDark: 'errorForeground',
          hcLight: 'errorForeground',
        },
        description: 'Foreground color for error messages in debug REPL console.',
      },
      {
        id: 'debugConsole.sourceForeground',
        defaults: {
          dark: 'foreground',
          light: 'foreground',
          hcDark: 'foreground',
          hcLight: 'foreground',
        },
        description: 'Foreground color for source filenames in debug REPL console.',
      },
      {
        id: 'debugConsoleInputIcon.foreground',
        defaults: {
          dark: 'foreground',
          light: 'foreground',
          hcDark: 'foreground',
          hcLight: 'foreground',
        },
        description: 'Foreground color for debug console input marker icon.',
      },
    ])
  }
}
