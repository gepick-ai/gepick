/** Should match the one from VariableResolverService. The format is `{{variableName:arg}}`. We allow {{}} and {{{}}} but no mixtures */
export const PROMPT_VARIABLE_TWO_BRACES_REGEX = /(?<!\{)\{\{\s*([^{}]+?)\s*\}\}(?!\})/g;
export const PROMPT_VARIABLE_THREE_BRACES_REGEX = /(?<!\{)\{\{\{\s*([^{}]+?)\s*\}\}\}(?!\})/g;
export function matchVariablesRegEx(template: string): RegExpMatchArray[] {
  const twoBraceMatches = [...template.matchAll(PROMPT_VARIABLE_TWO_BRACES_REGEX)];
  const threeBraceMatches = [...template.matchAll(PROMPT_VARIABLE_THREE_BRACES_REGEX)];
  return twoBraceMatches.concat(threeBraceMatches);
}

/** Match function/tool references in the prompt. The format is `~{functionId}`. */
export const PROMPT_FUNCTION_REGEX = /~\{\s*(.*?)\s*\}/g;

export function matchFunctionsRegEx(template: string): RegExpMatchArray[] {
  return [...template.matchAll(PROMPT_FUNCTION_REGEX)];
}
