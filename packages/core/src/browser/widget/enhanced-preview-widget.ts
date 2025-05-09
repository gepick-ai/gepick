import { isFunction, isObject } from '@gepick/core/common';

export interface EnhancedPreviewWidget {
  getEnhancedPreviewNode: () => Node | undefined;
}

export namespace EnhancedPreviewWidget {
  export function is(arg: unknown): arg is EnhancedPreviewWidget {
    return isObject<EnhancedPreviewWidget>(arg) && isFunction(arg.getEnhancedPreviewNode);
  }
}
