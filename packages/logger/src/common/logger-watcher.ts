import { Emitter, Event } from '@gepick/messaging/common';
import { ILogLevelChangedEvent, ILoggerClient } from '@gepick/logger/common';

class LoggerWatcher {
  getLoggerClient(): ILoggerClient {
    const emitter = this.onLogLevelChangedEmitter
    return {
      onLogLevelChanged(event: ILogLevelChangedEvent) {
        emitter.fire(event)
      },
    }
  }

  private onLogLevelChangedEmitter = new Emitter<ILogLevelChangedEvent>();

  get onLogLevelChanged(): Event<ILogLevelChangedEvent> {
    return this.onLogLevelChangedEmitter.event;
  }
}

export const loggerWatcher = new LoggerWatcher();
