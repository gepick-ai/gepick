/* @jsxImportSource vue */

import { PropType, computed, defineComponent, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { Spin, Textarea, message } from "ant-design-vue"
import { SendOutlined } from '@ant-design/icons-vue';

import { MdPreview } from "md-editor-v3";
import 'md-editor-v3/lib/style.css';
import "@gepick/copilot/browser/style/chat-bot.scss"
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';

import { countAndCompleteCodeBlocks, getChatHistories, useScroll } from '@gepick/copilot/browser';
import { ChatMessage, CopilotGuidePrompt, isCopilotGuidePrompt } from "@gepick/copilot/common"

const ChatBotProps = () => ({
  userInfo: {
    type: Object as PropType<{ avatarUrl: string, name: string }>,
  },
  prompt: {
    type: String,
    default: "",
  },
  onCompletionFinished: {
    type: Function as PropType<() => void>,
  },
})

export default defineComponent({
  name: "Chat-Bot",
  props: ChatBotProps(),
  setup(props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    const { scrollRef, scrollToBottom } = useScroll()

    const textLoading = ref<string>("唯一無二のエネルギーを注入中...")
    const isText = ref<boolean>(false)
    const waitingAnswer = ref<boolean>(false)
    const userPrompt = ref<string>("")

    const query = ref<string>("")
    // {
    //   role: "assistant",
    //   content: `あなたに深層占いを行うことができることをとても嬉しく思います。\nその前に、リラックスして深呼吸をし、今あなたが考えていることが本当にあなたの心からの思いであることを確認してください。`,
    // },
    const messages = ref<ChatMessage[]>([]);

    const displayMessages = computed(() => {
      const messagesCopy = messages.value.filter(m => !isCopilotGuidePrompt(m.content)).slice();
      const lastMessage = messagesCopy[messagesCopy.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        content: countAndCompleteCodeBlocks(lastMessage.content),
      };
      messagesCopy[messagesCopy.length - 1] = updatedLastMessage;
      return messagesCopy;
    })

    function handleInput(event: Event) {
      const target = event.target as HTMLInputElement;
      userPrompt.value = target.value;
      query.value = userPrompt.value
    };

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.altKey || e.shiftKey)) {
        // 当同时按下 alt或者shift 和 enter 时，插入一个换行符
        e.preventDefault();
        userPrompt.value += "\n";
      }
      else if (e.key === "Enter") {
        if (!waitingAnswer.value) {
          // 当只按下 enter 时，发送消息
          e.preventDefault();
          sendUserPrompt();
          waitingAnswer.value = true;
          emit("loading-start", query.value)
        }
      }
    }

    async function createCompletion(query: string) {
      class RetriableError extends Error { }

      class FatalError extends Error { }

      const ctrl = new AbortController()

      async function createSse(url: string, body: Record<string, any>) {
        await fetchEventSource(url, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: ctrl.signal,
          onclose() {
            const { onCompletionFinished } = props;

            onCompletionFinished?.()
            waitingAnswer.value = false;
            isText.value = false;
            emit("loading-end")
          },
          onerror(err: any) {
            // eslint-disable-next-line no-console
            console.log("onerror", err)
            if (err instanceof FatalError) {
              throw err; // rethrow to stop the operation
            }
            else {
              // do nothing to automatically retry. You can also
              // return a specific retry interval here.
            }
          },
          async onopen(response: any) {
            if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
              // everything's good
            }
            else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              // client-side errors are usually non-retriable:
              throw new FatalError();
            }
            else {
              throw new RetriableError();
            }
          },
          onmessage(evt: any) {
            try {
              const res = JSON.parse(String(evt.data))

              if (!res || !res.message || !res.message.type) {
                return;
              }

              if (res.message.type === 'answer') {
                const msg = messages.value[messages.value.length - 1];

                msg.content += res.message.content;

                if (res.attachments && res.attachments.length > 0) {
                  msg.attachments = res.attachments
                }

                if (scrollRef.value) {
                  scrollToBottom()
                }
              }
            }
            catch (err) {
              console.error(err)
            }
          },
        })
      }

      // ==================进行OpenAI API请求==================
      try {
        createSse(process.env.COPILOT_CHAT_URL ?? `http://localhost:3000/api/copilot/chat`, {
          query,
        })

        /**
         * 创建一个空的助手消息，是为了在读取流的时候，不断地将助手的消息推入到message中
         */
        messages.value.push({
          content: "",
          role: "assistant",
        });
      }
      catch (error) {
        message.error((error as Error).message)
        // eslint-disable-next-line no-console
        console.log((error as Error).message)
      }
    }

    async function sendUserPrompt(prompt?: string) {
      if (userPrompt.value || prompt) {
        if (prompt) {
          messages.value.push({
            content: prompt,
            role: "user",
          });

          query.value = prompt
        }
        else {
          messages.value.push({
            content: userPrompt.value,
            role: "user",
          });
        }

        userPrompt.value = "";

        const token = window.localStorage.getItem("token")
        if (!token) {
          message.error("ログイン後にご利用ください。")
          router.push({ name: "Login" })
          return;
        }

        await createCompletion(query.value);
      }
    }

    async function sendOmikujiPrompt(prompt: string) {
      if (userPrompt.value || prompt) {
        const omikujiId = route.query.omikujiId

        if (!omikujiId) {
          return;
        }

        // eslint-disable-next-line no-console
        console.log("🚀 ~ sendOmikujiPrompt ~ omikujiId:", omikujiId)

        if (prompt) {
          messages.value.push({
            content: prompt,
            role: "user",
          });

          query.value = prompt
        }
        else {
          messages.value.push({
            content: userPrompt.value,
            role: "user",
          });
        }

        userPrompt.value = "";

        const token = window.localStorage.getItem("token")
        if (!token) {
          message.error("ログイン後にご利用ください。")
          router.push({ name: "Login" })
          return;
        }

        await createCompletion(`${query.value}_${omikujiId}`);
      }
    }

    onMounted(async () => {
      const { conversations } = await getChatHistories()
      messages.value = [
        ...messages.value,
        ...conversations.map(conversation => conversation.messages).flat(),
      ]

      if (messages.value.length === 0) {
        createCompletion(CopilotGuidePrompt.Divination)
      }
      else {
        const msg = messages.value[messages.value.length - 2]

        // TODO(@jaylenchen) 避开业务上多次重复操作点击进来，用户可能点击了能量壁纸，来到占卜，然后重新回能量壁纸再次点击占卜这样就不断生成提示语，个人觉得没啥必要。沟通业务侧这一部份如何做
        if (isCopilotGuidePrompt(msg.content)) {
          if (!route.query.prompt && msg.content === CopilotGuidePrompt.Divination) {
            return;
          }
          if (route.query.prompt && msg.content === CopilotGuidePrompt.Wallpaper) {
            return;
          }

          if (route.query.prompt && msg.content === CopilotGuidePrompt.Omikuji) {
            return;
          }
        }

        if (!route.query.prompt) {
          createCompletion(CopilotGuidePrompt.Divination)
        }
        else {
          if (route.query.prompt.includes("深度解读")) {
            sendOmikujiPrompt(route.query.prompt as string)
          }
          else {
            createCompletion(route.query.prompt as string)
          }
        }
      }
    })

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    onUpdated(() => {
      if (scrollRef.value) {
        scrollToBottom();
      }
    })

    return () => (
      <div class="chat-assistant">
        <div class="message-area" ref={scrollRef}>
          <div class="message-area-content">
            {messages.value.length > 0
              ? (
                  <div class="message-container">
                    {displayMessages.value.map((msg, index) => (
                      <div key={index} class="message-template">
                        {msg.role === 'user'
                          ? (
                              <div class="user-message">
                                {
                                  props.userInfo?.avatarUrl
                                    ? <img src={props.userInfo?.avatarUrl} class="avatar" />
                                    : (
                                        <div class="default-avatar">
                                          <span>{props.userInfo?.name[0].toUpperCase()}</span>
                                        </div>
                                      )
                                }

                                <div class="user-message-content message-content">{msg.content}</div>
                              </div>
                            )
                          : (
                              <div class="assistant-message">
                                <div class="avatar">
                                  Gepick
                                </div>
                                {
                                  msg.content
                                    ? (
                                        <div class="assistant-content">
                                          <div class="assistant-attachments">
                                            {
                                              msg.attachments?.map((attachment, index) => (
                                                <div key={index} class="attachment">
                                                  {
                                                    attachment.type === "image"
                                                      ? (
                                                          <img src={attachment.value} style={{ width: '125px', height: '222px' }} draggable={false} />
                                                        )
                                                      : (attachment.type === "button" && attachment.handler === "click")
                                                          ? (<button>{attachment.value}</button>)
                                                          : (<button>{attachment.value}</button>)
                                                  }
                                                </div>
                                              ))
                                            }
                                          </div>
                                          <MdPreview modelValue={msg.content} class="assistant-message-content message-content" />
                                        </div>
                                      )
                                    : (
                                        <div class="assistant-content content-loading">
                                          {isText.value ? <div>{textLoading.value}</div> : <Spin></Spin>}
                                        </div>
                                      )
                                }

                              </div>
                            )}
                      </div>
                    ))}
                  </div>
                )
              : (
                  <div class="no-message-container"></div>
                )}
          </div>
        </div>
        <div class="prompt-area">
          <div class="prompt-area-content">
            <div class="user-input">
              <Textarea
                value={userPrompt.value}
                onInput={handleInput}
                auto-size={{ minRows: 1, maxRows: 6 }}
                placeholder="Gepickに伝えたい言葉を入力してください"
              />
              <div class="prompt-send-btn" onClick={() => sendUserPrompt()}>
                <SendOutlined />
              </div>
            </div>
          </div>
        </div>
        <div class="default-area"></div>
      </div>
    );
  },
})
