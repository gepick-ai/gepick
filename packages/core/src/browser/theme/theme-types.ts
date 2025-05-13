import { URI } from 'vscode-uri';

export type ThemeType = 'light' | 'dark' | 'hc' | 'hcLight';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  readonly id: string;
  readonly type: ThemeType;
  readonly label: string;
  readonly description?: string;
  readonly editorTheme?: string;
  activate?: () => void;
  deactivate?: () => void;
}

export function isHighContrast(scheme: ThemeType): boolean {
  return scheme === 'hc' || scheme === 'hcLight';
}

export function getThemeMode(type: ThemeType): ThemeMode {
  return (type === 'hc' || type === 'dark') ? 'dark' : 'light';
}

export interface ThemeChangeEvent {
  readonly newTheme: Theme;
  readonly oldTheme?: Theme;
}

export interface ThemeColor {
  readonly id: string;
}

export interface ThemeIcon {
  readonly id: string;
  readonly color?: ThemeColor;
}

export interface IconDefinition {
  font?: IconFontContribution; // undefined for the default font (codicon)
  fontCharacter: string;
}

export interface IconFontContribution {
  readonly id: string;
  readonly definition: IconFontDefinition;
}

export interface IconFontDefinition {
  readonly weight?: string;
  readonly style?: string;
  readonly src: IconFontSource[];
}

export interface IconFontSource {
  readonly location: URI;
  readonly format: string;
}
