import { Contribution, Module, ServiceModule } from "../../dependency-injection";
import { CommandContribution, ICommand } from "../command-contribution";

@Contribution(ICommand)
export class OpenPreferencesCommand extends CommandContribution implements ICommand {
  static override Id = 'preferences:open';
  static override Category = 'Preferences';
  static override Label = 'Open Settings (UI)';

  override execute(...args: any[]): void {
    // eslint-disable-next-line no-console
    console.log("args", args);
  }
}

@Module({
  services: [
    OpenPreferencesCommand,
  ],
})
export class PreferencesCommandsModule extends ServiceModule {}
