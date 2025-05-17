import { Color, ColorDefinition } from "@gepick/core/common";
import { AbstractThemePart } from "../../theme-part-contribution";

const ONE_HALF_OPACITY = 0.5;
export class MemoryThemePart extends AbstractThemePart {
  constructor() {
    super([
      {
        id: 'memoryDiff.removedTextBackground',
        defaults: {
          dark: Color.transparent('diffEditor.removedTextBackground', ONE_HALF_OPACITY),
          light: Color.transparent('diffEditor.removedTextBackground', ONE_HALF_OPACITY),
        },
        description: 'A less opaque diff color for use in the Memory Inspector where various overlays may me in place at once.',
      },
      {
        id: 'memoryDiff.insertedTextBackground',
        defaults: {
          dark: Color.transparent('diffEditor.insertedTextBackground', ONE_HALF_OPACITY),
          light: Color.transparent('diffEditor.insertedTextBackground', ONE_HALF_OPACITY),
        },
        description: 'A less opaque diff color for use in the Memory Inspector where various overlays may me in place at once.',
      },
      {
        id: 'memoryInspector.focusBorder',
        defaults: {
          dark: Color.transparent('focusBorder', ONE_HALF_OPACITY),
          light: Color.transparent('focusBorder', ONE_HALF_OPACITY),
        },
        description: 'A less opaque focus border color for use in the Memory Inspector where several overlays may be in place at once.',
      },
      {
        id: 'memoryInspector.foreground',
        defaults: {
          dark: Color.transparent('editor.foreground', ONE_HALF_OPACITY),
          light: Color.transparent('editor.foreground', ONE_HALF_OPACITY),
        },
        description: 'A less opaque foreground text style for use in the Memory Inspector',
      },
    ]);
  }
}
