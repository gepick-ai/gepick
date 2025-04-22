import { IContributionProvider, InjectableService, URI, createContribution, createServiceDecorator } from "@gepick/core/common";

export interface IPreferencesConfiguration {
  name: string;
}
export const [IPreferencesConfigurationContribution, IPreferencesConfigurationContributionProvider] = createContribution("PreferencesConfigurationContribution");

export class PreferencesConfiguration extends InjectableService {
  constructor(
    @IPreferencesConfigurationContributionProvider protected readonly provider: IContributionProvider<IPreferencesConfiguration>,
  ) {
    super();
  }

  /* prefer Theia over VS Code by default */
  getPaths(): string[] {
    return ['.theia', '.vscode'];
  }

  getConfigName(): string {
    return 'settings';
  }

  protected sectionNames: string[] | undefined;
  getSectionNames(): string[] {
    if (!this.sectionNames) {
      this.sectionNames = this.provider.getContributions().map(p => p.name);
    }
    return this.sectionNames;
  }

  isSectionName(name: string): boolean {
    return this.getSectionNames().includes(name);
  }

  isAnyConfig(name: string): boolean {
    return [...this.getSectionNames(), this.getConfigName()].includes(name);
  }

  isSectionUri(configUri: URI | undefined): boolean {
    return !!configUri && this.isSectionName(this.getName(configUri));
  }

  isConfigUri(configUri: URI | undefined): boolean {
    return !!configUri && this.getName(configUri) === this.getConfigName();
  }

  getName(configUri: URI): string {
    return configUri.path.name;
  }

  getPath(configUri: URI): string {
    return configUri.parent.path.base;
  }

  createUri(folder: URI, configPath: string = this.getPaths()[0], configName: string = this.getConfigName()): URI {
    return folder.resolve(configPath).resolve(`${configName}.json`);
  }
}
export const IPreferencesConfiguration = createServiceDecorator<IPreferencesConfiguration>(PreferencesConfiguration.name);
