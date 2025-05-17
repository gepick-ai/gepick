import { Module, ServiceModule } from "@gepick/core/common";
import { ThemeService } from "./theme-service";
import { MonacoColorRegistry } from "./monaco-color-registry";
import { stylingParticipants, themeParts } from "./test";
import { themeCommandsContribution } from "./contributions/command-contribution";
import { ThemeMenuContribution } from "./contributions/menu-contribution";
import { ColorService } from "./color-service";

@Module({
  services: [
    MonacoColorRegistry,
    ThemeService,
    ColorService,
    ...themeParts,
    ...themeCommandsContribution,
    ThemeMenuContribution,
    ...stylingParticipants,
  ],
})
export class ThemeModule extends ServiceModule {}
