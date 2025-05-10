import { Module, ServiceModule } from "@gepick/core/common";
import { ThemeService } from "./theme-service";
import { MonacoColorRegistry } from "./monaco-color-registry";
import { themeParts } from "./test";

@Module({
  services: [
    MonacoColorRegistry,
    ThemeService,
    ...themeParts,
  ],
})
export class ThemeModule extends ServiceModule {}
