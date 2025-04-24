import { CommandRegistry } from "./command";
import { Module, ServiceModule } from "./dependency-injection";
import { SelectionService } from "./selection-service";

@Module({
  services: [
    CommandRegistry,
    SelectionService,
  ],
})
export class CommonModule extends ServiceModule {}
