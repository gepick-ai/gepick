import path from "node:path"
import fs from "fs-extra"
import { InjectableService } from "@gepick/core/common";

export class FileService extends InjectableService {
  async readJson<T extends object>(path: string) {
    return fs.readJSON(path) as T
  }

  async readDir(path: string) {
    return fs.readdir(path)
  }
}

export const IFileService = FileService.createServiceDecorator()
export type IFileService = FileService
