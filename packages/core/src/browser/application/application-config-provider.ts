import deepmerge from "deepmerge";
import { FrontendApplicationConfig } from "./application-props";

export const DEFAULT_BACKGROUND_COLOR_STORAGE_KEY = 'theme.background';

export class FrontendApplicationConfigProvider {
  private static KEY = Symbol('FrontendApplicationConfigProvider');

  static get(): FrontendApplicationConfig {
    const config = FrontendApplicationConfigProvider.doGet();
    if (config === undefined) {
      throw new Error('The configuration is not set. Did you call FrontendApplicationConfigProvider#set?');
    }
    return config;
  }

  static set(config: FrontendApplicationConfig.Partial): void {
    if (FrontendApplicationConfigProvider.doGet() !== undefined) {
      throw new Error('The configuration is already set.');
    }
    const globalObject = window as any;
    const key = FrontendApplicationConfigProvider.KEY;
    globalObject[key] = deepmerge(FrontendApplicationConfig.DEFAULT, config);
  }

  private static doGet(): FrontendApplicationConfig | undefined {
    const globalObject = window as any;
    const key = FrontendApplicationConfigProvider.KEY;
    return globalObject[key];
  }
}
