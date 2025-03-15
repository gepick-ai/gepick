import { Module, ServiceModule } from "@gepick/core/common";
import { FileService } from "./file-service";

@Module({
    services:[
        FileService
    ]
})
export class FileModule extends ServiceModule {}