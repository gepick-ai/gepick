import { Contribution, IContributionProvider, InjectableService, createContribution } from "@gepick/core/common";
import { ThemeType } from "./theme-types";

export const StylingParticipant = Symbol('StylingParticipant');

export interface StylingParticipant {
  registerThemeStyle(theme: ColorTheme, collector: CssStyleCollector): void;
}

export interface ColorTheme {
  type: ThemeType;
  label: string;
  getColor(color: string): string | undefined;
}

export interface CssStyleCollector {
  addRule(rule: string): void;
}

export const [IStylingParticipant, IStylingParticipantProvider] = createContribution("StylingParticipant");
export type IStylingParticipant = StylingParticipant;
export type IStylingParticipantProvider = IContributionProvider<IStylingParticipant>;

@Contribution(IStylingParticipant)
export abstract class AbstractStylingParticipant extends InjectableService implements IStylingParticipant {
  abstract registerThemeStyle(theme: ColorTheme, collector: CssStyleCollector): void;
}
