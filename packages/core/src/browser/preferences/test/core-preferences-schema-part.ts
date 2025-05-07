import { createServiceDecorator } from "@gepick/core/common";
import { AbstractPreferencesSchemaPart } from "../preferences-schema-part-contribution";
import { AbstractPreferencesProxy } from "../preferences-proxy";

export class CorePreferencesSchemaPart extends AbstractPreferencesSchemaPart {
  constructor() {
    super({
      type: 'object',
      properties: {
        'workbench.sash.hoverDelay': {
          type: 'number',
          default: 300,
          minimum: 0,
          maximum: 2000,
          description: 'Controls the hover feedback delay in milliseconds of the dragging area in between views/editors.',
        },
        'workbench.sash.size': {
          type: 'number',
          default: 4,
          minimum: 1,
          maximum: 20,
          description: 'Controls the feedback area size in pixels of the dragging area in between views/editors. Set it to a larger value if you feel it\'s hard to resize views using the mouse.',
        },
      },
    });
  }
}
export const ICorePreferencesSchemaPart = createServiceDecorator<ICorePreferencesSchemaPart>(CorePreferencesSchemaPart.name);
export type ICorePreferencesSchemaPart = CorePreferencesSchemaPart;

export class CorePreferencesProxy extends AbstractPreferencesProxy<CorePreferencesProxy.IProperties> {
  constructor(
    @ICorePreferencesSchemaPart protected readonly corePreferencesSchemaPart: ICorePreferencesSchemaPart,
  ) {
    super(corePreferencesSchemaPart);
  }
}
export namespace CorePreferencesProxy {
  export interface IProperties {
    'workbench.sash.hoverDelay': number;
    'workbench.sash.size': number;
  }
}
export const ICorePreferencesProxy = createServiceDecorator<ICorePreferencesProxy>(CorePreferencesProxy.name);
export type ICorePreferencesProxy = CorePreferencesProxy;
