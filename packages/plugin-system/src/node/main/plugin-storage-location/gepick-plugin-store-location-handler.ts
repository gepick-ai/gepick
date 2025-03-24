import { Contribution, InjectableService } from "@gepick/core/common";
import { URI } from "@gepick/core/node";
import { IPluginStorageLocationContext, IPluginStoreHandlerContribution, PluginStoreHandlerContribution } from "./plugin-store-handler-contribution";

@Contribution(PluginStoreHandlerContribution)
export class GepickPluginStoreLocationHandler extends InjectableService implements IPluginStoreHandlerContribution {
  registerPluginStoreLocation(pluginStoreLocationContext: IPluginStorageLocationContext): void {
    const location = new URI('file:///Users/jaylen/.gepick');
    const userPluginStoreLocation = location.withScheme('local-dir').toString();

    pluginStoreLocationContext.userPluginStoreLocations.push(userPluginStoreLocation);
  }
}
