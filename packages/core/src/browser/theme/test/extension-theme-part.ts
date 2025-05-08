import { Color } from "@gepick/core/common";
import { AbstractThemePart } from "../theme-part-contribution";

export class ExtensionThemePart extends AbstractThemePart {
  constructor() {
    super([
      {
        id: 'extensionButton.prominentBackground',
        defaults: {
          dark: '#327e36',
          light: '#327e36',
        },
        description: 'Button background color for actions extension that stand out (e.g. install button).',
      },
      {
        id: 'extensionButton.prominentForeground',
        defaults: {
          dark: Color.white,
          light: Color.white,
        },
        description: 'Button foreground color for actions extension that stand out (e.g. install button).',
      },
      {
        id: 'extensionButton.prominentHoverBackground',
        defaults: {
          dark: '#28632b',
          light: '#28632b',
        },
        description: 'Button background hover color for actions extension that stand out (e.g. install button).',
      },
      {
        id: 'extensionEditor.tableHeadBorder',
        defaults: {
          dark: Color.transparent('#ffffff', 0.7),
          light: Color.transparent('#000000', 0.7),
          hcDark: Color.white,
          hcLight: Color.black,
        },
        description: 'Border color for the table head row of the extension editor view',
      },
      {
        id: 'extensionEditor.tableCellBorder',
        defaults: {
          dark: Color.transparent('#ffffff', 0.2),
          light: Color.transparent('#000000', 0.2),
          hcDark: Color.white,
          hcLight: Color.black,
        },
        description: 'Border color for a table row of the extension editor view',
      },
      {
        id: 'extensionIcon.verifiedForeground',
        defaults: {
          dark: '#40a6ff',
          light: '#40a6ff',
        },
        description: 'The icon color for extension verified publisher.',
      },
    ]);
  }
}
