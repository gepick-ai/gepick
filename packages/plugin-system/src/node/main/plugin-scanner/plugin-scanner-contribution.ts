import os from "node:os";
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { createContribution } from '@gepick/core/common';
import { fileService } from "@gepick/core/node";
import { PluginType } from "../../../common/type";
import { PluginIdentifiers } from "../../../common/plugin-identifiers";
import { IPluginContributions, IPluginIdentifier, IPluginModel } from "../../../common/plugin-service";

export interface IPluginStorage {
  location: string;
  type: PluginType;
}

export interface IPluginSource {
  getPluginIdentifier: () => IPluginIdentifier;
  getPluginStorage: () => IPluginStorage;
  getPluginScannerName: () => string;
  getPluginManifest: () => Promise<any>;
  getPluginContributions: () => Promise<IPluginContributions>;
  getPluginModel: () => Promise<IPluginModel>;
}

export const [IPluginScanner, IPluginScannerProvider] = createContribution<IPluginScanner>("PluginScanner");
export interface IPluginScanner {
  get name(): string;
  canScan: (pluginStorageLocation: string) => boolean;
  scan: (pluginStorageLocation: string) => Promise<IPluginIdentifier[]>;
}

export async function getTempDirPathAsync(name: string): Promise<string> {
  let tempDir = os.tmpdir();
  // for mac os 'os.tmpdir()' return symlink, but we need real path
  if (process.platform === 'darwin') {
    tempDir = await fs.realpath(tempDir);
  }
  return path.resolve(tempDir, name);
}

export class PluginSource implements IPluginSource {
  constructor(
    private readonly pluginIdentifier: IPluginIdentifier,
    private readonly pluginStorage: IPluginStorage,
    private readonly pluginScanner: string,
  ) {}

  getPluginIdentifier(): IPluginIdentifier {
    return this.pluginIdentifier;
  };

  getPluginStorage(): IPluginStorage {
    return this.pluginStorage;
  };

  getPluginScannerName(): string {
    return this.pluginScanner;
  };

  async getPluginManifest(): Promise<any> {
    const manifest = await fileService.readJSON(this.pluginIdentifier.packageJsonPath);

    manifest.publisher ??= PluginIdentifiers.UNPUBLISHED;

    return manifest;
  }

  async getPluginContributions(): Promise<IPluginContributions> {
    const manifest = await this.getPluginManifest();

    return {
      activationEvents: manifest.activationEvents,
    };
  }

  async getPluginModel(): Promise<IPluginModel> {
    const manifest = await this.getPluginManifest();
    const identifier = this.getPluginIdentifier();

    return {
      description: manifest.description,
      displayName: manifest.displayName ?? "unsetted",
      name: manifest.name,
      identifier,
      version: manifest.version,
      entryPoint: path.resolve(identifier.sourcePath, manifest.main),
    };
  }
}
