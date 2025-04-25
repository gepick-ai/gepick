import { InjectableService, Module, PostConstruct, ServiceModule, createServiceDecorator } from "@gepick/core/common";
import { IPluginPreferencesService, IThemePreferencesService } from "@gepick/core/browser";

// 使用theme service
export class TestApplication extends InjectableService {
  constructor(
      @IThemePreferencesService private readonly themePreferencesService: IThemePreferencesService,
      @IPluginPreferencesService private readonly pluginPreferencesService: IPluginPreferencesService,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    // const themeBackground = this.themePreferencesService.get('theme.background');
    // // eslint-disable-next-line no-console
    // console.log("theme.background", themeBackground);

    // const themeIcon = this.themePreferencesService.get('theme.icon');
    // // eslint-disable-next-line no-console
    // console.log("theme.icon", themeIcon);

    // const pluginRegistry = this.pluginPreferencesService.get('plugin.registry');
    // // eslint-disable-next-line no-console
    // console.log("plugin.registry", pluginRegistry);

    // const pluginProxy = this.pluginPreferencesService.get('plugin.proxy');
    // // eslint-disable-next-line no-console
    // console.log("plugin proxy", pluginProxy);
  }
}
export const ITestApplication = createServiceDecorator(TestApplication.name);

@Module({
  services: [TestApplication],
})
export class TestApplicationModule extends ServiceModule {}
