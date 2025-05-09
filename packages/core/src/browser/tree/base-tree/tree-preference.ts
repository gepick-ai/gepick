import { Module, ServiceModule, createServiceDecorator } from "@gepick/core/common";
import { AbstractPreferencesProxy, AbstractPreferencesSchemaPart } from "../../preferences";

export const PREFERENCE_NAME_TREE_INDENT = 'workbench.tree.indent';

export class TreePreferencesSchemaPart extends AbstractPreferencesSchemaPart {
  constructor() {
    super({
      type: 'object',
      properties: {
        [PREFERENCE_NAME_TREE_INDENT]: {
          description: 'Controls tree indentation in pixels.',
          type: 'number',
          default: 8,
          minimum: 4,
          maximum: 40,
        },
      },
    });
  }
}

export const ITreePreferencesSchema = createServiceDecorator<ITreePreferencesSchema>(TreePreferencesSchemaPart.name);
export type ITreePreferencesSchema = TreePreferencesSchemaPart;

export namespace TreePreferencesService {
  export interface IProperties {
    [PREFERENCE_NAME_TREE_INDENT]: number;
  }
}

export class TreePreferencesService extends AbstractPreferencesProxy<TreePreferencesService.IProperties> {
  constructor(
      @ITreePreferencesSchema protected readonly treePreferencesSchema: ITreePreferencesSchema,
  ) {
    super(treePreferencesSchema);
  }
}

export const ITreePreferencesService = createServiceDecorator<ITreePreferencesService>(TreePreferencesService.name);
export type ITreePreferencesService = TreePreferencesService;

@Module({
  services: [
    TreePreferencesSchemaPart,
    TreePreferencesService,
  ],
})
export class TreePreferencesModule extends ServiceModule {}
