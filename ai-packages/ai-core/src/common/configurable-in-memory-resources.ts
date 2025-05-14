import { Emitter, Event, InjectableService, MarkdownString, Reference, Resource, ResourceResolver, SyncReferenceCollection, URI, createServiceDecorator } from "@gepick/core/common";

/** For creating highly configurable in-memory resources */
export class ConfigurableInMemoryResources extends InjectableService implements ResourceResolver {
  protected readonly resources = new SyncReferenceCollection<string, ConfigurableMutableResource>(uri => new ConfigurableMutableResource(new URI(uri)));

  get onWillDispose(): Event<ConfigurableMutableResource> {
    return this.resources.onWillDispose;
  }

  add(uri: URI, options: ResourceInitializationOptions): ConfigurableMutableReferenceResource {
    const resourceUri = uri.toString();
    if (this.resources.has(resourceUri)) {
      throw new Error(`Cannot add already existing in-memory resource '${resourceUri}'`);
    }
    const resource = this.acquire(resourceUri);
    resource.update(options);
    return resource;
  }

  update(uri: URI, options: ResourceInitializationOptions): Resource {
    const resourceUri = uri.toString();
    const resource = this.resources.get(resourceUri);
    if (!resource) {
      throw new Error(`Cannot update non-existent in-memory resource '${resourceUri}'`);
    }
    resource.update(options);
    return resource;
  }

  resolve(uri: URI): ConfigurableMutableReferenceResource {
    const uriString = uri.toString();
    if (!this.resources.has(uriString)) {
      throw new Error(`In memory '${uriString}' resource does not exist.`);
    }
    return this.acquire(uriString);
  }

  protected acquire(uri: string): ConfigurableMutableReferenceResource {
    const reference = this.resources.acquire(uri);
    return new ConfigurableMutableReferenceResource(reference);
  }
}
export const IConfigurableInMemoryResources = createServiceDecorator<IConfigurableInMemoryResources>(ConfigurableInMemoryResources.name);
export type IConfigurableInMemoryResources = ConfigurableInMemoryResources;

export type ResourceInitializationOptions = Pick<Resource, 'autosaveable' | 'initiallyDirty' | 'readOnly'>
  & { contents?: string | Promise<string>; onSave?: Resource['saveContents'] };

export class ConfigurableMutableResource implements Resource {
  protected readonly onDidChangeContentsEmitter = new Emitter<void>();
  readonly onDidChangeContents = this.onDidChangeContentsEmitter.event;
  protected fireDidChangeContents(): void {
    this.onDidChangeContentsEmitter.fire();
  }

  protected readonly onDidChangeReadonlyEmitter = new Emitter<boolean | MarkdownString>();
  readonly onDidChangeReadOnly = this.onDidChangeReadonlyEmitter.event;

  constructor(readonly uri: URI, protected options?: ResourceInitializationOptions) { }

  get readOnly(): Resource['readOnly'] {
    return this.options?.readOnly;
  }

  get autosaveable(): boolean {
    return this.options?.autosaveable !== false;
  }

  get initiallyDirty(): boolean {
    return !!this.options?.initiallyDirty;
  }

  readContents(): Promise<string> {
    return Promise.resolve(this.options?.contents ?? '');
  }

  async saveContents(contents: string): Promise<void> {
    await this.options?.onSave?.(contents);
    this.update({ contents });
  }

  update(options: ResourceInitializationOptions): void {
    const didContentsChange = 'contents' in options && options.contents !== this.options?.contents;
    const didReadOnlyChange = 'readOnly' in options && options.readOnly !== this.options?.readOnly;
    this.options = { ...this.options, ...options };
    if (didContentsChange) {
      this.onDidChangeContentsEmitter.fire();
    }
    if (didReadOnlyChange) {
      this.onDidChangeReadonlyEmitter.fire(this.readOnly ?? false);
    }
  }

  dispose(): void {
    this.onDidChangeContentsEmitter.dispose();
  }
}

export class ConfigurableMutableReferenceResource implements Resource {
  constructor(protected reference: Reference<ConfigurableMutableResource>) { }

  get uri(): URI {
    return this.reference.object.uri;
  }

  get onDidChangeContents(): Event<void> {
    return this.reference.object.onDidChangeContents;
  }

  dispose(): void {
    this.reference.dispose();
  }

  readContents(): Promise<string> {
    return this.reference.object.readContents();
  }

  saveContents(contents: string): Promise<void> {
    return this.reference.object.saveContents(contents);
  }

  update(options: ResourceInitializationOptions): void {
    this.reference.object.update(options);
  }

  get readOnly(): Resource['readOnly'] {
    return this.reference.object.readOnly;
  }

  get initiallyDirty(): boolean {
    return this.reference.object.initiallyDirty;
  }

  get autosaveable(): boolean {
    return this.reference.object.autosaveable;
  }
}
