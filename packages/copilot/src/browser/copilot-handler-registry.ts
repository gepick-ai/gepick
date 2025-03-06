// TODO(@jaylenchen):
import { CopilotHandlerId } from "@gepick/copilot/common"
// eslint-disable-next-line ts/no-unsafe-function-type
export const CopilotHandlerRegistry = new Map<string, Function>()

CopilotHandlerRegistry.set(CopilotHandlerId.Yes, () => {
  // eslint-disable-next-line no-console
  console.log("yes")
})
