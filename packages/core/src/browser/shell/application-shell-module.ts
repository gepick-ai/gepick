import { Module, ServiceModule } from "@gepick/core/common";
import { SplitPositionHandler } from "./side-panel";
import { ApplicationShell } from "./application-shell";

@Module({
  services: [
    ApplicationShell,
    SplitPositionHandler,
  ],
})
export class ApplicationShellModule extends ServiceModule {}
