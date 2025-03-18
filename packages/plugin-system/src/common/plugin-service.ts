import { InjectableService } from "@gepick/core/common";

export interface IPluginService extends InjectableService {
  sendMessage: (message: string) => Promise<void>
}
