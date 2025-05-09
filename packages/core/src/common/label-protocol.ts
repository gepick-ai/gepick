// copied and modified from https://github.com/microsoft/vscode/blob/1.44.2/src/vs/platform/label/common/label.ts#L35-L49

export interface ResourceLabelFormatter {
  scheme: string;
  authority?: string;
  priority?: boolean;
  formatting: ResourceLabelFormatting;
}

export interface ResourceLabelFormatting {
  label: string; // myLabel:/${path}
  separator: '/' | '\\' | '';
  tildify?: boolean;
  normalizeDriveLetter?: boolean;
  authorityPrefix?: string;
}
