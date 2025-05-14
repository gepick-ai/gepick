import { Emitter, Event, InjectableService } from '@gepick/core/common';
import { CommunicationHistory, CommunicationRecordingService, CommunicationRequestEntry, CommunicationRequestEntryParam, CommunicationResponseEntry, CommunicationResponseEntryParam } from '@gepick/ai-core/common';

export class DefaultCommunicationRecordingService extends InjectableService implements CommunicationRecordingService {
  protected onDidRecordRequestEmitter = new Emitter<CommunicationRequestEntry>();
  readonly onDidRecordRequest: Event<CommunicationRequestEntry> = this.onDidRecordRequestEmitter.event;

  protected onDidRecordResponseEmitter = new Emitter<CommunicationResponseEntry>();
  readonly onDidRecordResponse: Event<CommunicationResponseEntry> = this.onDidRecordResponseEmitter.event;

  protected onStructuralChangeEmitter = new Emitter<void>();
  readonly onStructuralChange: Event<void> = this.onStructuralChangeEmitter.event;

  protected history: Map<string, CommunicationHistory> = new Map();

  getHistory(agentId: string): CommunicationHistory {
    return this.history.get(agentId) || [];
  }

  getSessionHistory(sessionId: string): CommunicationHistory {
    return Array.from(
      this.history.values(),
    ).reduce((acc, current) =>
      acc.concat(current.filter(entry => entry.sessionId === sessionId)), []);
  }

  recordRequest(requestEntry: CommunicationRequestEntryParam): void {
    // eslint-disable-next-line no-console
    console.debug('Recording request:', requestEntry.request);
    const completedEntry = { timestamp: Date.now(), ...requestEntry };
    if (!this.history.has(requestEntry.agentId)) {
      this.history.set(requestEntry.agentId, [completedEntry]);
    }
    else {
      const agentHistory = this.history.get(requestEntry.agentId)!;
      const existingEntryIndex = agentHistory.findIndex(e => e.requestId === requestEntry.requestId);
      if (existingEntryIndex !== -1) {
        agentHistory[existingEntryIndex] = {
          ...agentHistory[existingEntryIndex],
          ...completedEntry,
        };
      }
      else {
        agentHistory.push(completedEntry);
      }
    }
    this.onDidRecordRequestEmitter.fire(completedEntry);
  }

  recordResponse(responseEntry: CommunicationResponseEntryParam): void {
    // eslint-disable-next-line no-console
    console.debug('Recording response:', responseEntry.response);
    const completedEntry = { timestamp: Date.now(), ...responseEntry };
    if (this.history.has(completedEntry.agentId)) {
      const agentHistory = this.history.get(completedEntry.agentId);
      if (agentHistory) {
        const matchingRequest = agentHistory.find(e => e.requestId === completedEntry.requestId);
        if (!matchingRequest) {
          throw new Error('No matching request found for response');
        }
        matchingRequest.response = completedEntry.response;
        matchingRequest.responseTime = completedEntry.timestamp - matchingRequest.timestamp;
        this.onDidRecordResponseEmitter.fire(completedEntry);
      }
    }
  }

  clearHistory(): void {
    this.history.clear();
    this.onStructuralChangeEmitter.fire(undefined);
  }
}
