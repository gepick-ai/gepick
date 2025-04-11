import { SourceTreeWidget } from "@gepick/core/browser";

export class PluginRegistryWidget extends SourceTreeWidget {
  static ID = 'vsx-extensions';

  protected override render(): React.ReactNode {
    throw new Error("Method not implemented.");
  }
}
