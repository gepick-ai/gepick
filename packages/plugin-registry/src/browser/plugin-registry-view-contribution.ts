import { AbstractViewContribution, IViewContribution } from "@gepick/core/browser";
import { Contribution } from "@gepick/core/common";

@Contribution(IViewContribution)
export class PluginRegistryViewContribution extends AbstractViewContribution<any> {}
