export enum CopilotGuidePrompt {
  Divination = '__GEPICK_Divination_GUIDE__',
  Wallpaper = '__GEPICK_WALLPAPER_GUIDE__',
  Omikuji = '__GEPICK_OMIKUJI_GUIDE__',
}

export function isCopilotGuidePrompt(query: string): query is CopilotGuidePrompt {
  return Object.values(CopilotGuidePrompt).includes(query as CopilotGuidePrompt);
}
