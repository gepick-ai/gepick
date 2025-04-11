import { isFunction, isObject } from "@gepick/core/common";

/**
 * A contract for widgets that want to store and restore their inner state, between sessions.
 */
export interface StatefulWidget {

  /**
   * Called on unload to store the inner state. Returns 'undefined' if the widget cannot be stored.
   */
  storeState: () => object | undefined;

  /**
   * Called when the widget got created by the storage service
   */
  restoreState: (oldState: object) => void;
}

export namespace StatefulWidget {
  export function is(arg: unknown): arg is StatefulWidget {
    return isObject<StatefulWidget>(arg) && isFunction(arg.storeState) && isFunction(arg.restoreState);
  }
}
