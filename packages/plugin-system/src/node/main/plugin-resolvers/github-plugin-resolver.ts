import { IPluginResolver, IPluginResolverContext } from '@gepick/plugin-system/common';

export class GithubPluginResolver implements IPluginResolver {
  accept: (pluginSourceId: string) => boolean;
  resolve: (pluginResolverContext: IPluginResolverContext) => Promise<void>;
}
