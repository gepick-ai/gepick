import fs from "fs-extra";
import { InjectableService, createServiceDecorator } from "@gepick/core/common";

export class FileService extends InjectableService {
  async readJson<T extends object>(path: string) {
    return fs.readJSON(path) as T;
  }

  async readDir(path: string) {
    fs.ensureDirSync(path);
    return fs.readdir(path);
  }

  async pathExists(path: string) {
    return fs.pathExists(path);
  }
}

export const IFileService = createServiceDecorator<IFileService>("FileService");
export type IFileService = FileService;
