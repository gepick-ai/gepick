import { IPreferencesService } from '@gepick/core/browser';
import { Prioritizeable } from '@gepick/core/common';
import { LanguageModel, LanguageModelResponse, LanguageModelServiceImpl, UserRequest } from '@gepick/ai-core/common';
import { PREFERENCE_NAME_REQUEST_SETTINGS, RequestSetting, getRequestSettingSpecificity } from './ai-core-preferences';

export class FrontendLanguageModelServiceImpl extends LanguageModelServiceImpl {
  @IPreferencesService protected preferenceService: IPreferencesService;

  override async sendRequest(
    languageModel: LanguageModel,
    languageModelRequest: UserRequest,
  ): Promise<LanguageModelResponse> {
    const requestSettings = this.preferenceService.get<RequestSetting[]>(PREFERENCE_NAME_REQUEST_SETTINGS, []);

    const ids = languageModel.id.split('/');
    const matchingSetting = mergeRequestSettings(requestSettings, ids[1], ids[0], languageModelRequest.agentId);
    if (matchingSetting?.requestSettings) {
      // Merge the settings, with user request taking precedence
      languageModelRequest.settings = {
        ...matchingSetting.requestSettings,
        ...languageModelRequest.settings,
      };
    }
    if (matchingSetting?.clientSettings) {
      // Merge the clientSettings, with user request taking precedence
      languageModelRequest.clientSettings = {
        ...matchingSetting.clientSettings,
        ...languageModelRequest.clientSettings,
      };
    }

    return super.sendRequest(languageModel, languageModelRequest);
  }
}

export const mergeRequestSettings = (requestSettings: RequestSetting[], modelId: string, providerId: string, agentId: string): RequestSetting => {
  const prioritizedSettings = Prioritizeable.prioritizeAllSync(requestSettings, setting => getRequestSettingSpecificity(setting, {
    modelId,
    providerId,
    agentId,
  }));
    // merge all settings from lowest to highest, identical priorities will be overwritten by the following
  const matchingSetting = prioritizedSettings.reduceRight((acc, cur) => ({ ...acc, ...cur.value }), {} as RequestSetting);
  return matchingSetting;
};
