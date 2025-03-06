import { randomUUID } from 'node:crypto';

const botId = "7394730586557923334";
const token
  = "pat_VWTk1boARm2YQx3We05hcERNlOt6GssKTDcHJVrvjS7SM9NfRYlnBiSDgMAnjATo";

// 创建会话的函数
export async function createChatSession(
  userId: string,
  query: string,
  chatHistory: any[] = [],
) {
  const url = "https://api.coze.com/open_api/v2/chat";

  // 构建请求体
  const requestBody = {
    bot_id: botId,
    user: userId,
    query,
    conversation_id: randomUUID(),
    chat_history: chatHistory,
    stream: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Connection": "keep-alive",
      },
      body: JSON.stringify(requestBody),
    });

    return response
  }
  catch (error) {
    console.error(
      "Error creating chat session:",
      (error as any).response ? (error as any).response.data : (error as any).message,
    );

    return null;
  }
}
