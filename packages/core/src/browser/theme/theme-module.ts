import { Module, ServiceModule } from "@gepick/core/common";
import { CommonThemePart, DebugThemePart, ExtensionThemePart, GitThemePart, MemoryThemePart, NotebookThemePart, NotificationsThemePart, ScmThemePart, TerminalThemePart } from "./test";
import { ThemeService } from "./theme-service";
import { MonacoColorRegistry } from "./monaco-color-registry";

@Module({
  services: [
    MonacoColorRegistry,
    ThemeService,
    CommonThemePart,
    ExtensionThemePart,
    NotificationsThemePart,
    NotebookThemePart,
    ScmThemePart,
    TerminalThemePart,
    MemoryThemePart,
    GitThemePart,
    DebugThemePart,
  ],
})
export class ThemeModule extends ServiceModule {}
