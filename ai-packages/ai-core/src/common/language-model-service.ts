import { InjectableService } from '@gepick/core/common';
import { ILanguageModelRegistry, LanguageModel, LanguageModelRegistry, LanguageModelResponse, UserRequest } from './language-model';
import { CommunicationRecordingService, ICommunicationRecordingService } from './communication-recording-service';

export const LanguageModelService = Symbol('LanguageModelService');
export interface LanguageModelService {
  /**
     * Submit a language model request in the context of the given `chatRequest`.
     */
  sendRequest(
    languageModel: LanguageModel,
    languageModelRequest: UserRequest
  ): Promise<LanguageModelResponse>;
}

export class LanguageModelServiceImpl extends InjectableService implements LanguageModelService {
  constructor(
    @ILanguageModelRegistry protected languageModelRegistry: ILanguageModelRegistry,
    @ICommunicationRecordingService protected recordingService: ICommunicationRecordingService,
  ) {
    super();
  }

  async sendRequest(
    languageModel: LanguageModel,
    languageModelRequest: UserRequest,
  ): Promise<LanguageModelResponse> {
    // Filter messages based on client settings
    languageModelRequest.messages = languageModelRequest.messages.filter((message) => {
      if (message.type === 'thinking' && languageModelRequest.clientSettings?.keepThinking === false) {
        return false;
      }
      if ((message.type === 'tool_result' || message.type === 'tool_use')
        && languageModelRequest.clientSettings?.keepToolCalls === false) {
        return false;
      }
      // Keep all other messages
      return true;
    });

    return languageModel.request(languageModelRequest, languageModelRequest.cancellationToken);
  }
}
