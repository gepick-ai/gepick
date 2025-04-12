import { IServiceContainer, InjectableService, createServiceDecorator } from "@gepick/core/common";
import { IMarkdownRenderer } from "./markdown-renderer";

export class MarkdownRendererFactory extends InjectableService {
  constructor(
    @IServiceContainer protected readonly serviceContainer: IServiceContainer,
  ) {
    super();
  }

  createMarkdownRenderer(): IMarkdownRenderer {
    return this.serviceContainer.get<IMarkdownRenderer>(IMarkdownRenderer);
  }
}

export const IMarkdownRendererFactory = createServiceDecorator<IMarkdownRendererFactory>(MarkdownRendererFactory.name);
export type IMarkdownRendererFactory = MarkdownRendererFactory;
