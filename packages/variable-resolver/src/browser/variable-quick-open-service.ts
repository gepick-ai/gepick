import { InjectableService, createServiceDecorator } from '@gepick/core/common';
import { IVariableRegistry, Variable } from './variable';
import { IVariableResolverService } from './variable-resolver-service';

// TODO(@jaylenchen): 补充相关模块后替换这里为相关缺失模块的具体定义
const IQuickInputService = createServiceDecorator("QuickInputService");
export type IQuickInputService = any;
export type QuickPickItem = any;
export type IMessageService = any;
const IMessageService = createServiceDecorator("MessageService");

export class VariableQuickOpenService extends InjectableService {
  protected items: Array<QuickPickItem>;
  constructor(
        @IMessageService protected readonly messages: IMessageService,
        @IQuickInputService protected readonly quickInputService: IQuickInputService,
        @IVariableResolverService protected readonly variableResolver: IVariableResolverService,
        @IVariableRegistry protected readonly variableRegistry: IVariableRegistry,
  ) {
    super();
  }

  open(): void {
    this.items = this.variableRegistry.getVariables().map(v => ({
      label: `\${${v.name}}`,
      detail: v.description,
      execute: () => {
        setTimeout(() => this.showValue(v));
      },
    }));

    this.quickInputService?.showQuickPick(this.items, { placeholder: 'Registered variables' });
  }

  protected async showValue(variable: Variable): Promise<void> {
    const argument = await this.quickInputService?.input({
      placeHolder: 'Type a variable argument',
    });
    const value = await this.variableResolver.resolve(`\${${variable.name}:${argument}}`);
    if (typeof value === 'string') {
      this.messages.info(value);
    }
  }
}
export const IVariableQuickOpenService = createServiceDecorator<IVariableQuickOpenService>(VariableQuickOpenService.name);
export type IVariableQuickOpenService = VariableQuickOpenService;
