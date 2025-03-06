export class MessageAttachment {
  constructor(
    public type: 'image' | 'button',
    public value: string,
    public handler?: string,
  ) {}
}

/**
 * 聊天消息实体
 */
export class ChatMessage {
  constructor(
    /**
     * 角色
     */
    public role: 'system' | 'assistant' | 'user',
    /**
     * 内容
     */
    public content: string,
    /**
     * 附件
     */
    public attachments?: MessageAttachment[],

    // TODO add userid and createdAt
  ) {}
}

/**
 * 配额实体
 */
export class CopilotQuota {
  constructor(
    /**
     * 配额限制
     */
    public limit: number,
    /**
     * 已使用
     */
    public used: number,
  ) {}
}

/**
 *  会话实体
 */
export class Conversation {
  constructor(
    public conversationId: string,
    public messages: ChatMessage[],
    public createdAt: Date,
  ) {}
}
