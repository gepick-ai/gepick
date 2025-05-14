import { Event, createServiceDecorator } from "@gepick/core/common";
import { LanguageModelMessage } from './language-model/language-model-contribution';

export type CommunicationHistory = CommunicationHistoryEntry[];

export interface CommunicationHistoryEntryBase {
  agentId: string;
  sessionId: string;
  timestamp: number;
  requestId: string;
}

export interface CommunicationHistoryEntry extends CommunicationHistoryEntryBase {
  request?: LanguageModelMessage[];
  response?: LanguageModelMessage[];
  responseTime?: number;
}

export type CommunicationRequestEntry = Omit<CommunicationHistoryEntry, 'response' | 'responseTime'>;
export type CommunicationResponseEntry = Omit<CommunicationHistoryEntry, 'request'>;

export type CommunicationRequestEntryParam = Omit<CommunicationRequestEntry, 'timestamp'> & Partial<Pick<CommunicationRequestEntry, 'timestamp'>>;
export type CommunicationResponseEntryParam = Omit<CommunicationResponseEntry, 'timestamp'> & Partial<Pick<CommunicationResponseEntry, 'timestamp'>>;

export const CommunicationRecordingService = Symbol('CommunicationRecordingService');
export interface CommunicationRecordingService {
  recordRequest(requestEntry: CommunicationRequestEntryParam): void;
  readonly onDidRecordRequest: Event<CommunicationRequestEntry>;

  recordResponse(responseEntry: CommunicationResponseEntryParam): void;
  readonly onDidRecordResponse: Event<CommunicationResponseEntry>;

  getHistory(agentId: string): CommunicationHistory;

  getSessionHistory(sessionId: string): CommunicationHistory;

  clearHistory(): void;
  readonly onStructuralChange: Event<void>;
}
export const ICommunicationRecordingService = createServiceDecorator<ICommunicationRecordingService>("CommunicationRecordingService");
export type ICommunicationRecordingService = CommunicationRecordingService;
