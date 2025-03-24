import { createContribution } from '@gepick/core/common';
import { IPluginScannerContext } from "../../../common/plugin-protocol";

export const [IPluginResolver, IPluginResolverProvider] = createContribution<IPluginResolver>("PluginResolverContribution");
export interface IPluginResolver {
  accept: (pluginSourceId: string) => boolean;
  resolve: (pluginResolverContext: IPluginScannerContext) => Promise<void>;
}
