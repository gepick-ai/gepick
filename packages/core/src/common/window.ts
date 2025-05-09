/**
 * The window hash value that is used to spawn a new default window.
 */
export const DEFAULT_WINDOW_HASH: string = '!empty';

/**
 * The options for opening new windows.
 */
export interface NewWindowOptions {
  /**
   * Controls whether the window should be opened externally.
   */
  readonly external?: boolean;
}

export interface WindowSearchParams {
  [key: string]: string;
}
