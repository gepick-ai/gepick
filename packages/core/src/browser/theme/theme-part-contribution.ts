import { ColorDefinition, Contribution, IContributionProvider, InjectableService, Unmanaged, createContribution } from "@gepick/core/common";

export const [IThemePart, IThemePartProvider] = createContribution("ThemePart");
export interface IThemePart {
  getColorDefinitions: () => ColorDefinition[];
}
export interface IThemePartProvider extends IContributionProvider<IThemePart> {}

@Contribution(IThemePart)
export abstract class AbstractThemePart extends InjectableService implements IThemePart {
  constructor(@Unmanaged() private readonly colorDefinitions: ColorDefinition[] = []) {
    super();
  }

  getColorDefinitions(): ColorDefinition[] {
    return this.colorDefinitions;
  }
}
