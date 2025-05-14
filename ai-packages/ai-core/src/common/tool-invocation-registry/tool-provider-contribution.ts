import { IContributionProvider, createContribution } from "@gepick/core/common";
import { ToolRequest } from "../language-model";

export const ToolProvider = Symbol('ToolProvider');
export interface ToolProvider {
  getTool(): ToolRequest;
}

export const [IToolProvider, IToolProviderProvider] = createContribution<IToolProvider>("ToolProvider");
export type IToolProvider = ToolProvider;
export interface IToolProviderProvider extends IContributionProvider<IToolProvider> {}
