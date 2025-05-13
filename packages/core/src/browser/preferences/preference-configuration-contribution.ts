import { IContributionProvider, createContribution } from "@gepick/core/common";

export const [IPreferenceConfiguration, IPreferenceConfigurationProvider] = createContribution<IPreferenceConfiguration>('PreferenceConfiguration');
export interface IPreferenceConfiguration {
  name: string;
}
export interface IPreferenceConfigurationProvider extends IContributionProvider<IPreferenceConfiguration> {}
