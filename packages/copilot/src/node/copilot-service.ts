import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { Response } from 'express';
import { quotaService } from '@gepick/user/node';
import { Conversation } from '@gepick/copilot/common';
import { ChatMessageClass, ConversationModel, createChatSession } from '@gepick/copilot/node';

export interface ICopilotServiceContribution {
  copilotHandler: (query: string, chatHistory: string[]) => void
}

class CopilotService {
  async copilotHandler(userId: string, query: string, chatHistory: { role: string, content: string }[], res: Response) {
    /**
     * 参数1: userId
     * 参数2: query
     * 参数3: chatHistory
     */
    const quota = await quotaService.getChatQuota(userId);

    if (quota.chatUsed >= quota.chatLimit) {
      res.status(500).send("クォータ使用上限");
      return;
    }

    try {
      const userMessage = {
        role: "user",
        content: query,
      } as ChatMessageClass
      const assistantMessage = {
        role: "assistant",
        content: '',
        attachments: [],
      } as ChatMessageClass

      const conversation: Conversation = {
        conversationId: "",
        messages: [
          userMessage,
          assistantMessage,
        ],
        createdAt: new Date(),
      }

      const response = await createChatSession(userId, query, chatHistory);
      await quotaService.updateChatQuota(userId, { chatUsed: quota.chatUsed + 1 });

      if (response && response.body) {
        let buffer = '';
        const writableStream = new Writable({
          write: async (chunk, encoding, callback) => {
            try {
              // 添加新的chunk到buffer
              buffer += chunk.toString();
              // 查找完整的 SSE 消息边界
              let boundary = buffer.indexOf('\n\n');

              while (boundary !== -1) {
                // 提取一条完整的 SSE 消息
                const message = buffer.slice(0, boundary);

                // 处理单条 SSE 消息
                if (message.startsWith('data:')) {
                  const jsonString = message.slice(5).trim();
                  try {
                    const parsedData = JSON.parse(jsonString);

                    if (parsedData && parsedData.message && parsedData.message.type) {
                      if (parsedData.message.type === 'answer') {
                        assistantMessage.content += parsedData.message.content;
                      }

                      // 保持原始数据格式写回
                      res.write(`data: ${jsonString}\n\n`, encoding);

                      if (parsedData?.message?.content.includes("generate_answer_finish")) {
                        // 在这个地方，存储msg到数据库
                        conversation.conversationId = parsedData.conversation_id;

                        this.saveConversation(conversation, userId);

                        res.end();
                      }
                    }
                  }
                  catch (err) {
                    console.error('Failed to parse message JSON:', err);
                  }
                }
                // 更新缓冲区,只保留未处理的部分
                buffer = buffer.slice(boundary + 2);
                // 查找下一条消息
                boundary = buffer.indexOf('\n\n');
              }
              // 如果所有消息都处理完了,清空buffer
              if (buffer.trim().length === 0) {
                buffer = '';
              }

              callback();
            }
            catch (err) {
              callback(err as any);
            }
          },
        });

        await pipeline(response.body as any, writableStream);
      }
      else {
        res.status(204).send(); // No Content
      }
    }
    catch (e) {
      console.error((e as Error).message);
      res.status(500).send((e as Error).message);
    }
  }

  async copilotGuideHandler(query: string, res: Response) {
    const userMessage = {
      role: "user" as "user" | "assistant" | "system",
      content: query,
    }
    const assistantMessage = {
      role: "assistant" as "user" | "assistant" | "system",
      // content: `很高兴即将为你进行一次深度占卜。\n在此之前，请放松您的心情深呼吸，确保脑海所想之事是您当前真实的想法。`,
      content: `深い占いをこれから行うことができ、とても嬉しいです。
その前に、心を落ち着けて深呼吸をしてください。今頭の中で考えていることが、あなたの本当の気持ちであることを確認しましょう。`,
      attachments: [],
    }

    const conversation = {
      conversationId: query,
      messages: [
        userMessage,
        assistantMessage,
      ],
      createdAt: new Date(),
    }

    const descData = {
      message: {
        ...assistantMessage,
        type: "answer",
        content_type: "text",
      },
    }

    res.write(`data: ${JSON.stringify(descData)}\n\n`);
    res.end();

    return conversation
  }

  async saveConversation(conversation: Conversation, userId: string) {
    const newConversation = new ConversationModel({
      ...conversation,
      userId,
    });

    await newConversation.save();
  }

  async getConversationHistories(userId: string) {
    const conversationHistories = await ConversationModel.find({ userId })
      .sort({ createdAt: 1 }) // 1 表示升序(旧->新), -1 表示降序(新->旧)
      .exec();

    return conversationHistories;
  }
}

export const copilotService = new CopilotService();
