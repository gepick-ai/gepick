import { Router } from 'express';
import { setupSse } from "@gepick/shared/node"
import { COPILOT_CHAT_API, ChatMessage, Conversation, GET_COPILOT_HISTORY_API, GetCopilotHistoryResponseDto } from "@gepick/copilot/common"
import { copilotService } from "@gepick/copilot/node"

export function useCopilotRouter(router: Router) {
  router.post(COPILOT_CHAT_API, async (req, res) => {
    setupSse(res)
    // TODO(@jaylenchen): 补充req的类型
    const { id: userId } = (req as any).user
    const { query } = req.body

    const histories = await copilotService.getConversationHistories(userId);
    const chatHistory = histories.map(h => h.messages.map(m => ({ role: m.role, content: m.content }))).flat().slice(-30)

    copilotService.copilotHandler(userId, query, chatHistory, res)
  })

  router.get(GET_COPILOT_HISTORY_API, async (req, res) => {
    // TODO(@jaylenchen): 补充req的类型
    const { id: userId } = (req as any).user;

    const histories = await copilotService.getConversationHistories(userId);

    res.send(new GetCopilotHistoryResponseDto(histories.map(history => new Conversation(history.conversationId, history.messages.map(m => new ChatMessage(m.role, m.content, m.attachments)), history.createdAt))))
  })
}
