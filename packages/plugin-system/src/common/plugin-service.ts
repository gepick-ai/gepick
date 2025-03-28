import { InjectableService, createServiceDecorator } from "@gepick/core/common";

export const IPluginService = createServiceDecorator<IPluginService>("PluginService");
export interface IPluginService extends InjectableService {
  setClient: (client: IPluginClient) => void;
  onMessage: (message: string) => Promise<void>;
  startPluginHostProcess: () => Promise<void>;
  // getDeployedMetadata: () => Promise<any[]>;
  getDeployedPlugins: () => Promise<IDeployedPlugin[]>;
}

export interface IPluginIdentifier {
  id: string;
  sourcePath: string;
  packageJsonPath: string;
}

export interface IPluginModel {
  identifier: IPluginIdentifier;
  description: string;
  displayName: string;
  name: string;
  version: string;
  entryPoint: string;
}

export interface IPluginContributions {
  activationEvents: string[];
}

export interface IDeployedPlugin {
  contributions: IPluginContributions;
  model: IPluginModel;
}

export const IPluginClient = Symbol('PluginClient');
export interface IPluginClient {
  onMessage: (message: string) => Promise<void>;
}
