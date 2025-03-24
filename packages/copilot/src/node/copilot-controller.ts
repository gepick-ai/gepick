import { Router } from 'express';
import { IApplicationContribution, setupSse } from "@gepick/core/node";
import { COPILOT_CHAT_API, ChatMessage, Conversation, GET_COPILOT_HISTORY_API, GetCopilotHistoryResponseDto } from "@gepick/copilot/common";
import { Contribution, InjectableService } from '@gepick/core/common';
import { ICopilotService } from './copilot-service';

@Contribution(IApplicationContribution)
export class CopilotController extends InjectableService implements IApplicationContribution {
  constructor(
    @ICopilotService private readonly copilotService: ICopilotService,
  ) {
    super();
  }

  onApplicationConfigure(app: Router): void {
    app.post(COPILOT_CHAT_API, async (req, res) => {
      setupSse(res);
      // TODO(@jaylenchen): 补充req的类型
      const { id: userId } = (req as any).user;
      const { query } = req.body;

      const histories = await this.copilotService.getConversationHistories(userId);
      const chatHistory = histories.map(h => h.messages.map(m => ({ role: m.role, content: m.content }))).flat().slice(-30);

      this.copilotService.copilotHandler(userId, query, chatHistory, res);
    });

    app.get(GET_COPILOT_HISTORY_API, async (req, res) => {
      // TODO(@jaylenchen): 补充req的类型
      const { id: userId } = (req as any).user;

      const histories = await this.copilotService.getConversationHistories(userId);

      res.send(new GetCopilotHistoryResponseDto(histories.map(history => new Conversation(history.conversationId, history.messages.map(m => new ChatMessage(m.role, m.content, m.attachments)), history.createdAt))));
    });
  }
}
