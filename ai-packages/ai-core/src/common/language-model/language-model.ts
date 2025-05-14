import { Emitter, InjectableService, PostConstruct } from "@gepick/core/common";
import { ILanguageModelProviderProvider, LanguageModel, LanguageModelRegistry, LanguageModelSelector, isModelMatching } from "./language-model-contribution";

export class DefaultLanguageModelRegistryImpl extends InjectableService implements LanguageModelRegistry {
  @ILanguageModelProviderProvider protected readonly languageModelContributions: ILanguageModelProviderProvider;

  protected languageModels: LanguageModel[] = [];

  protected markInitialized: () => void;
  protected initialized: Promise<void> = new Promise((resolve) => { this.markInitialized = resolve; });

  protected changeEmitter = new Emitter<{ models: LanguageModel[] }>();
  onChange = this.changeEmitter.event;

  @PostConstruct()
  protected init(): void {
    const contributions = this.languageModelContributions.getContributions();
    const promises = contributions.map(provider => provider());
    Promise.allSettled(promises).then((results) => {
      for (const result of results) {
        if (result.status === 'fulfilled') {
          this.languageModels.push(...result.value);
        }
        else {
          console.error('Failed to add some language models:', result.reason);
        }
      }
      this.markInitialized();
    });
  }

  addLanguageModels(models: LanguageModel[]): void {
    models.forEach((model) => {
      if (this.languageModels.find(lm => lm.id === model.id)) {
        console.warn(`Tried to add already existing language model with id ${model.id}. The new model will be ignored.`);
        return;
      }
      this.languageModels.push(model);
      this.changeEmitter.fire({ models: this.languageModels });
    });
  }

  async getLanguageModels(): Promise<LanguageModel[]> {
    await this.initialized;
    return this.languageModels;
  }

  async getLanguageModel(id: string): Promise<LanguageModel | undefined> {
    await this.initialized;
    return this.languageModels.find(model => model.id === id);
  }

  removeLanguageModels(ids: string[]): void {
    ids.forEach((id) => {
      const index = this.languageModels.findIndex(model => model.id === id);
      if (index !== -1) {
        this.languageModels.splice(index, 1);
        this.changeEmitter.fire({ models: this.languageModels });
      }
      else {
        console.warn(`Language model with id ${id} was requested to be removed, however it does not exist`);
      }
    });
  }

  async selectLanguageModels(request: LanguageModelSelector): Promise<LanguageModel[]> {
    await this.initialized;
    // TODO check for actor and purpose against settings
    return this.languageModels.filter(model => isModelMatching(request, model));
  }

  async selectLanguageModel(request: LanguageModelSelector): Promise<LanguageModel | undefined> {
    return (await this.selectLanguageModels(request))[0];
  }
}
