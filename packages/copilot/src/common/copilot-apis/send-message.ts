// import { Hint, Message } from "@gepick/copilot/common"

class Hint { }

class Message {}

export const SEND_MESSAGE_API = "/chat/send"; // send message

export class SendMessageRequestDto {
  constructor(public userId: string, public content: string) { }
}

export class SendMessageResponseDto {
  constructor(public messages: Message[], public hints: Hint[]) { }
}
