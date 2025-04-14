import { IOpenHandler, WidgetOpenHandler } from "@gepick/core/browser";
import { Contribution, URI } from "@gepick/core/common";
import { IPluginOptions } from "../plugin/plugin-component";
import { VSCodeExtensionUri } from "../vscode-util";
import { PluginEditor } from "./plugin-editor";

@Contribution(IOpenHandler)
export class PluginEditorManager extends WidgetOpenHandler<PluginEditor> {
  readonly id = PluginEditor.ID;

  canHandle(uri: URI): number {
    const id = VSCodeExtensionUri.toId(uri);
    return id ? 500 : 0;
  }

  protected createWidgetOptions(uri: URI): IPluginOptions {
    const id = VSCodeExtensionUri.toId(uri);
    if (!id) {
      throw new Error(`Invalid URI: ${uri.toString()}`);
    }

    return id as IPluginOptions;
  }
}
