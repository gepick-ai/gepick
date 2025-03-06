import { Emitter, Event } from "../../common/event"
import { IPluginClient } from "../../common/plugin-protocol"

export class HostedPluginWatcher {
  private onPostMessage = new Emitter<string[]>()

  /**
   * 获取hosted plugin client，它有一个postMessage方法，用来发送消息。
   * 内部其实就是event emitter fire了序列化的message而已。
   *
   * 而emitter的event在hosted plugin进行create server rpc的时候被用来进行
   * onMessage的赋值。也就是说一旦client post message了，那么server rpc的onMessage就会被触发。
   */
  getHostedPluginClient(): IPluginClient {
    const messageEmitter = this.onPostMessage;

    return {
      postMessage(message: string): Promise<void> {
        messageEmitter.fire(JSON.parse(message));
        return Promise.resolve();
      },
    };
  }

  get onPostMessageEvent(): Event<string[]> {
    return this.onPostMessage.event;
  }
}

export const hostedPluginWatcher = new HostedPluginWatcher();
