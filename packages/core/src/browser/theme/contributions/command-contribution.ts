import { AbstractCommand, IQuickInputService, QuickPickItem, QuickPickItemOrSeparator, lodashDebounce } from "@gepick/core/common";
import { IThemeService } from "../theme-service";

export class SelectColorThemeCommand extends AbstractCommand {
  static override Id = 'workbench.action.selectTheme';
  static override Category = 'Preferences';
  static override Label = 'Color Theme';

  constructor(
    @IThemeService protected readonly themeService: IThemeService,
    // @IQuickInputService protected readonly quickInputService: IQuickInputService,
  ) {
    super();
  }

  override execute(): void {
    let resetTo: string | undefined = this.themeService.getCurrentTheme().id;
    const setTheme = (id: string, persist: boolean) => this.themeService.setCurrentTheme(id, persist);
    const previewTheme = lodashDebounce(setTheme, 200);

    type QuickPickWithId = QuickPickItem & { id: string };
    const itemsByTheme: {
      light: Array<QuickPickWithId>;
      dark: Array<QuickPickWithId>;
      hc: Array<QuickPickWithId>;
      hcLight: Array<QuickPickWithId>;
    } = { light: [], dark: [], hc: [], hcLight: [] };

    const lightThemesSeparator = 'light themes';
    const darkThemesSeparator = 'dark themes';
    const highContrastThemesSeparator = 'high contrast themes';

    for (const theme of this.themeService.getThemes().sort((a, b) => a.label.localeCompare(b.label))) {
      const themeItems: QuickPickItemOrSeparator[] = itemsByTheme[theme.type];

      // Add a separator for the first item in the respective group.
      // High Contrast Themes despite dark or light should be grouped together.
      if (themeItems.length === 0 && theme.type !== 'hcLight') {
        let label = '';
        if (theme.type === 'light') {
          label = lightThemesSeparator;
        }
        else if (theme.type === 'dark') {
          label = darkThemesSeparator;
        }
        else {
          label = highContrastThemesSeparator;
        }
        themeItems.push({
          type: 'separator',
          label,
        });
      }

      themeItems.push({
        id: theme.id,
        label: theme.label,
        description: theme.description,
      });
    }

    const items = [...itemsByTheme.light, ...itemsByTheme.dark, ...itemsByTheme.hc, ...itemsByTheme.hcLight];

    // debugger;
    setTheme(items[1].id, true);
    // this.quickInputService?.showQuickPick(items, {
    //   placeholder: 'Select Color Theme',
    //   activeItem: items.find(item => item.id === resetTo),
    //   onDidChangeSelection: (_, selectedItems) => {
    //     resetTo = undefined;
    //     setTheme(selectedItems[0].id, true);
    //   },
    //   onDidChangeActive: (_, activeItems) => {
    //     previewTheme(activeItems[0].id, false);
    //   },
    //   onDidHide: () => {
    //     if (resetTo) {
    //       setTheme(resetTo, false);
    //     }
    //   },
    // });
  }
}

export const themeCommandsContribution = [
  SelectColorThemeCommand,
];
