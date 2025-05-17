import { Emitter, IQuickInputService, InjectableService, Optional, QuickInputButtonHandle, QuickPick, QuickPickItem, QuickPickOptions, QuickPickSeparator, QuickPickService } from '@gepick/core/common';

export class QuickPickServiceImpl extends InjectableService implements QuickPickService {
  @Optional() @IQuickInputService protected readonly quickInputService: IQuickInputService;

  private readonly onDidHideEmitter = new Emitter<void>();
  readonly onDidHide = this.onDidHideEmitter.event;

  private readonly onDidChangeValueEmitter = new Emitter<{ quickPick: QuickPick<QuickPickItem>; filter: string }>();
  readonly onDidChangeValue = this.onDidChangeValueEmitter.event;

  private readonly onDidAcceptEmitter = new Emitter<void>();
  readonly onDidAccept = this.onDidAcceptEmitter.event;

  private readonly onDidChangeActiveEmitter = new Emitter<{ quickPick: QuickPick<QuickPickItem>; activeItems: Array<QuickPickItem> }>();
  readonly onDidChangeActive = this.onDidChangeActiveEmitter.event;

  private readonly onDidChangeSelectionEmitter = new Emitter<{ quickPick: QuickPick<QuickPickItem>; selectedItems: Array<QuickPickItem> }>();
  readonly onDidChangeSelection = this.onDidChangeSelectionEmitter.event;

  private readonly onDidTriggerButtonEmitter = new Emitter<QuickInputButtonHandle>();
  readonly onDidTriggerButton = this.onDidTriggerButtonEmitter.event;

  private items: Array<any> = [];

  async show<T extends QuickPickItem>(items: Array<T | QuickPickSeparator>, options?: QuickPickOptions<T>): Promise<T | undefined> {
    this.items = items;
    const opts = Object.assign({}, options, {
      onDidAccept: () => this.onDidAcceptEmitter.fire(),
      onDidChangeActive: (quickPick: QuickPick<T>, activeItems: Array<QuickPickItem>) => this.onDidChangeActiveEmitter.fire({ quickPick, activeItems }),
      onDidChangeSelection: (quickPick: QuickPick<T>, selectedItems: Array<QuickPickItem>) => this.onDidChangeSelectionEmitter.fire({ quickPick, selectedItems }),
      onDidChangeValue: (quickPick: QuickPick<T>, filter: string) => this.onDidChangeValueEmitter.fire({ quickPick, filter }),
      onDidHide: () => this.onDidHideEmitter.fire(),
      onDidTriggerButton: (btn: QuickInputButtonHandle) => this.onDidTriggerButtonEmitter.fire(btn),
    });
    return this.quickInputService?.showQuickPick<T>(this.items, opts);
  }

  hide(): void {
    this.quickInputService?.hide();
  }

  setItems<T>(items: Array<QuickPickItem>): void {
    this.items = items;
  }
}
