import { CommandRegistry } from "./command";
import { Module, ServiceModule } from "./instantiation";
import { SelectionService } from "./selection-service";

@Module({
  services: [
    CommandRegistry,
    SelectionService,
  ],
})
export class CommonModule extends ServiceModule {}
