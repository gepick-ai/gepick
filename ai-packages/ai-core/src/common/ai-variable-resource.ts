import deepEqual from 'fast-deep-equal';
import stableJsonStringify from 'fast-json-stable-stringify';
import { InjectableService, PostConstruct, Resource, URI, createServiceDecorator, generateUuid } from '@gepick/core/common';
import { AIVariableContext, AIVariableResolutionRequest } from './variable-service/variable-service';
import { ConfigurableMutableReferenceResource, IConfigurableInMemoryResources } from './configurable-in-memory-resources';

export const AI_VARIABLE_RESOURCE_SCHEME = 'ai-variable';
export const NO_CONTEXT_AUTHORITY = 'context-free';

export class AIVariableResourceResolver extends InjectableService {
  constructor(
    @IConfigurableInMemoryResources protected readonly inMemoryResources: IConfigurableInMemoryResources,
  ) {
    super();
  }

  @PostConstruct()
  protected init(): void {
    this.inMemoryResources.onWillDispose(resource => this.cache.delete(resource.uri.toString()));
  }

  protected readonly cache = new Map<string, [Resource, AIVariableContext]>();

  getOrCreate(request: AIVariableResolutionRequest, context: AIVariableContext, value: string): ConfigurableMutableReferenceResource {
    const uri = this.toUri(request, context);
    try {
      const existing = this.inMemoryResources.resolve(uri);
      existing.update({ contents: value });
      return existing;
    }
    catch { /* No-op */ }
    const fresh = this.inMemoryResources.add(uri, { contents: value, readOnly: true, initiallyDirty: false });
    const key = uri.toString();
    this.cache.set(key, [fresh, context]);
    return fresh;
  }

  protected toUri(request: AIVariableResolutionRequest, context: AIVariableContext): URI {
    return URI.fromComponents({
      scheme: AI_VARIABLE_RESOURCE_SCHEME,
      query: stableJsonStringify({ arg: request.arg, name: request.variable.name }),
      path: '/',
      authority: this.toAuthority(context),
      fragment: '',
    });
  }

  protected toAuthority(context: AIVariableContext): string {
    try {
      if (deepEqual(context, {})) { return NO_CONTEXT_AUTHORITY; }
      for (const [resource, cachedContext] of this.cache.values()) {
        if (deepEqual(context, cachedContext)) {
          return resource.uri.authority;
        }
      }
    }
    catch (err) {
      // Mostly that deep equal could overflow the stack, but it should run into === or inequality before that.
      console.warn('Problem evaluating context in AIVariableResourceResolver', err);
    }
    return generateUuid();
  }

  fromUri(uri: URI): { variableName: string; arg: string | undefined } | undefined {
    if (uri.scheme !== AI_VARIABLE_RESOURCE_SCHEME) { return undefined; }
    try {
      const { name: variableName, arg } = JSON.parse(uri.query);
      return variableName
        ? {
            variableName,
            arg,
          }
        : undefined;
    }
    catch { return undefined; }
  }
}
export const IAIVariableResourceResolver = createServiceDecorator<IAIVariableResourceResolver>(AIVariableResourceResolver.name);
export type IAIVariableResourceResolver = AIVariableResourceResolver;
