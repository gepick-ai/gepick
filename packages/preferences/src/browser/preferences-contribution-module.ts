import { Module, ServiceModule } from "@gepick/core/common";
import { OpenPreferencesCommand, ResetPreferencesCommand } from "./contributions/command-contribution";
import { PreferencesMenuContribution } from "./contributions/menu-contribution";
import { PreferencesView } from "./contributions/view-contribution";

@Module({
  services: [
    // #region Command Contribution
    OpenPreferencesCommand,
    ResetPreferencesCommand,
    // #endregion

    // #region Menu Contribution
    PreferencesMenuContribution,
    // #endregion

    // #region View Contribution
    PreferencesView,
    // #endregion
  ],
})
export class PreferencesContributionModule extends ServiceModule {}
