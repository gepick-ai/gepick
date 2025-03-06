import { Conversation } from "@gepick/copilot/common"

export const GET_COPILOT_HISTORY_API = "/copilot/history"; // get chat history

export class GetCopilotHistoryRequestDto {
  constructor(public userId: string) { }
}

export class GetCopilotHistoryResponseDto {
  constructor(public conversations: Conversation[]) { }
}
