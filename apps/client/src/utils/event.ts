import { CopilotGuidePrompt } from '@gepick/copilot/common';
import { Emitter } from '@gepick/core/common';

export const OmikujiEmitter = new Emitter<{ prompt: string, omikujiId: any }>()
export const WallpaperEmitter = new Emitter<void>()
export const DivinationEmitter = new Emitter<CopilotGuidePrompt>()
