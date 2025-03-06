import { randomUUID } from 'node:crypto';
import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { ChatMessage, Conversation, MessageAttachment } from "@gepick/copilot/common"

@modelOptions({ schemaOptions: { collection: 'chat-messages' } })
export class ChatMessageClass extends ChatMessage {
  @prop({ required: true })
  public override role: 'system' | 'assistant' | 'user';

  @prop({ required: true })
  public override content: string;

  @prop()
  public override attachments: MessageAttachment[];
}

export const ChatMessageModel = getModelForClass(ChatMessageClass)

@modelOptions({ schemaOptions: { collection: 'conversations' } })
export class ConversationClass extends Conversation {
  @prop({ required: true, default: () => randomUUID() })
  public _id: string;

  @prop({ required: true })
  public override conversationId: string;

  @prop({ type: ChatMessageClass, required: true })
  public override messages: ChatMessageClass[];

  @prop({ required: true })
  public override createdAt: Date;

  @prop({ required: true })
  public userId: string;
}

export const ConversationModel = getModelForClass(ConversationClass)
