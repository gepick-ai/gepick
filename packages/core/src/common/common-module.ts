import { CommandRegistry } from "./command";
import { Module, ServiceModule } from "./instantiation";

@Module({
  services: [
    CommandRegistry,
  ],
})
export class CommonModule extends ServiceModule {}
