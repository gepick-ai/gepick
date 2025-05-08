import { Color } from "@gepick/core/common";
import { AbstractThemePart } from "../theme-part-contribution";

export namespace ScmColors {
  export const editorGutterModifiedBackground = 'editorGutter.modifiedBackground';
  export const editorGutterAddedBackground = 'editorGutter.addedBackground';
  export const editorGutterDeletedBackground = 'editorGutter.deletedBackground';
}

export class ScmThemePart extends AbstractThemePart {
  constructor() {
    super([
      {
        id: ScmColors.editorGutterModifiedBackground,
        defaults: {
          dark: '#1B81A8',
          light: '#2090D3',
          hcDark: '#1B81A8',
          hcLight: '#2090D3',
        },
        description: 'Editor gutter background color for lines that are modified.',
      },
      {
        id: ScmColors.editorGutterAddedBackground,
        defaults: {
          dark: '#487E02',
          light: '#48985D',
          hcDark: '#487E02',
          hcLight: '#48985D',
        },
        description: 'Editor gutter background color for lines that are added.',
      },
      {
        id: ScmColors.editorGutterDeletedBackground,
        defaults: {
          dark: 'editorError.foreground',
          light: 'editorError.foreground',
          hcDark: 'editorError.foreground',
          hcLight: 'editorError.foreground',
        },
        description: 'Editor gutter background color for lines that are deleted.',
      },
      {
        id: 'minimapGutter.modifiedBackground',
        defaults: {
          dark: 'editorGutter.modifiedBackground',
          light: 'editorGutter.modifiedBackground',
          hcDark: 'editorGutter.modifiedBackground',
          hcLight: 'editorGutter.modifiedBackground',
        },
        description: 'Minimap gutter background color for lines that are modified.',
      },
      {
        id: 'minimapGutter.addedBackground',
        defaults: {
          dark: 'editorGutter.addedBackground',
          light: 'editorGutter.addedBackground',
          hcDark: 'editorGutter.modifiedBackground',
          hcLight: 'editorGutter.modifiedBackground',
        },
        description: 'Minimap gutter background color for lines that are added.',
      },
      {
        id: 'minimapGutter.deletedBackground',
        defaults: {
          dark: 'editorGutter.deletedBackground',
          light: 'editorGutter.deletedBackground',
          hcDark: 'editorGutter.deletedBackground',
          hcLight: 'editorGutter.deletedBackground',
        },
        description: 'Minimap gutter background color for lines that are deleted.',
      },
      {
        id: 'editorOverviewRuler.modifiedForeground',
        defaults: {
          dark: Color.transparent(ScmColors.editorGutterModifiedBackground, 0.6),
          light: Color.transparent(ScmColors.editorGutterModifiedBackground, 0.6),
          hcDark: Color.transparent(ScmColors.editorGutterModifiedBackground, 0.6),
          hcLight: Color.transparent(ScmColors.editorGutterModifiedBackground, 0.6),
        },
        description: 'Overview ruler marker color for modified content.',
      },
      {
        id: 'editorOverviewRuler.addedForeground',
        defaults: {
          dark: Color.transparent(ScmColors.editorGutterAddedBackground, 0.6),
          light: Color.transparent(ScmColors.editorGutterAddedBackground, 0.6),
          hcDark: Color.transparent(ScmColors.editorGutterAddedBackground, 0.6),
          hcLight: Color.transparent(ScmColors.editorGutterAddedBackground, 0.6),
        },
        description: 'Overview ruler marker color for added content.',
      },
      {
        id: 'editorOverviewRuler.deletedForeground',
        defaults: {
          dark: Color.transparent(ScmColors.editorGutterDeletedBackground, 0.6),
          light: Color.transparent(ScmColors.editorGutterDeletedBackground, 0.6),
          hcDark: Color.transparent(ScmColors.editorGutterDeletedBackground, 0.6),
          hcLight: Color.transparent(ScmColors.editorGutterDeletedBackground, 0.6),
        },
        description: 'Overview ruler marker color for deleted content.',
      },
    ]);
  }
}
