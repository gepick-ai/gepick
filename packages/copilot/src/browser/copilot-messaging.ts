import { messagingService } from "@gepick/core/browser"
import { GET_COPILOT_HISTORY_API, GetCopilotHistoryResponseDto } from "@gepick/copilot/common"

/**
 * 获取聊天记录
 */
export async function getChatHistories() {
  const [err, res] = await messagingService.get<GetCopilotHistoryResponseDto>(GET_COPILOT_HISTORY_API);

  if (err) {
    console.error(err.message);
  }

  if (!res) {
    throw new Error('Failed to get chat history');
  }

  return res;
}
