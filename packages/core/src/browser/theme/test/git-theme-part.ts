import { ColorDefinition } from "@gepick/core/common";
import { AbstractThemePart } from "../theme-part-contribution";

export class GitThemePart extends AbstractThemePart {
  constructor() {
    super([
      {
        id: 'gitDecoration.addedResourceForeground',
        description: 'Color for added resources.',
        defaults: {
          light: '#587c0c',
          dark: '#81b88b',
          hcDark: '#a1e3ad',
          hcLight: '#374e06',
        },
      },
      {
        id: 'gitDecoration.modifiedResourceForeground',
        description: 'Color for modified resources.',
        defaults: {
          light: '#895503',
          dark: '#E2C08D',
          hcDark: '#E2C08D',
          hcLight: '#895503',
        },
      },
      {
        id: 'gitDecoration.deletedResourceForeground',
        description: 'Color for deleted resources.',
        defaults: {
          light: '#ad0707',
          dark: '#c74e39',
          hcDark: '#c74e39',
          hcLight: '#ad0707',
        },
      },
      {
        id: 'gitDecoration.untrackedResourceForeground',
        description: 'Color for untracked resources.',
        defaults: {
          light: '#007100',
          dark: '#73C991',
          hcDark: '#73C991',
          hcLight: '#007100',
        },
      },
      {
        id: 'gitDecoration.conflictingResourceForeground',
        description: 'Color for resources with conflicts.',
        defaults: {
          light: '#6c6cc4',
          dark: '#6c6cc4',
          hcDark: '#c74e39',
          hcLight: '#ad0707',
        },
      },
      {
        id: 'gitlens.gutterBackgroundColor',
        description: 'Specifies the background color of the gutter blame annotations',
        defaults: {
          dark: '#FFFFFF13',
          light: '#0000000C',
          hcDark: '#FFFFFF13',
        },
      },
      {
        id: 'gitlens.gutterForegroundColor',
        description: 'Specifies the foreground color of the gutter blame annotations',
        defaults: {
          dark: '#BEBEBE',
          light: '#747474',
          hcDark: '#BEBEBE',
        },
      },
      {
        id: 'gitlens.lineHighlightBackgroundColor',
        description: 'Specifies the background color of the associated line highlights in blame annotations',
        defaults: {
          dark: '#00BCF233',
          light: '#00BCF233',
          hcDark: '#00BCF233',
        },
      },
    ]);
  }
}
