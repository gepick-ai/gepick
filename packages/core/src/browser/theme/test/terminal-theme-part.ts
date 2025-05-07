import { Color, ColorDefinition } from "@gepick/core/common";
import { AbstractThemePart } from "../theme-part-contribution";

export class TerminalThemePart extends AbstractThemePart {
  constructor() {
    super([
      {
        id: 'terminal.background',
        defaults: {
          dark: 'panel.background',
          light: 'panel.background',
          hcDark: 'panel.background',
          hcLight: 'panel.background',
        },
        description: 'The background color of the terminal, this allows coloring the terminal differently to the panel.',
      },
      {
        id: 'terminal.foreground',
        defaults: {
          light: '#333333',
          dark: '#CCCCCC',
          hcDark: '#FFFFFF',
          hcLight: '#292929',
        },
        description: 'The foreground color of the terminal.',
      },
      {
        id: 'terminalCursor.foreground',
        description: 'The foreground color of the terminal cursor.',
      },
      {
        id: 'terminalCursor.background',
        description: 'The background color of the terminal cursor. Allows customizing the color of a character overlapped by a block cursor.',
      },
      {
        id: 'terminal.selectionBackground',
        defaults: {
          light: 'editor.selectionBackground',
          dark: 'editor.selectionBackground',
          hcDark: 'editor.selectionBackground',
          hcLight: 'editor.selectionBackground',
        },
        description: 'The selection background color of the terminal.',
      },
      {
        id: 'terminal.inactiveSelectionBackground',
        defaults: {
          light: Color.transparent('terminal.selectionBackground', 0.5),
          dark: Color.transparent('terminal.selectionBackground', 0.5),
          hcDark: Color.transparent('terminal.selectionBackground', 0.7),
          hcLight: Color.transparent('terminal.selectionBackground', 0.5),
        },
        description: 'The selection background color of the terminal when it does not have focus.',
      },
      {
        id: 'terminal.selectionForeground',
        defaults: {
          light: undefined,
          dark: undefined,
          hcDark: '#000000',
          hcLight: '#ffffff',
        },

        description: 'The selection foreground color of the terminal. When this is null the selection foreground will be retained and have the minimum contrast ratio feature applied.',
      },
      {
        id: 'terminal.border',
        defaults: {
          light: 'panel.border',
          dark: 'panel.border',
          hcDark: 'panel.border',
          hcLight: 'panel.border',
        },
        description: 'The color of the border that separates split panes within the terminal. This defaults to panel.border.',
      },
    ]);
  }
}
