import { Module, ServiceModule } from "@gepick/core/common";
import { CommandContributions } from "./command-contribution";
import { PreferencesMenuContribution } from "./menu-contribution";
import { PreferencesView } from "./view-contribution";

@Module({
  services: [
    // #region Command Contribution
    ...CommandContributions,
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
