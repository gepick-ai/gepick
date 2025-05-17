import { CancellationToken, IContributionProvider, IDisposable, QuickPicks, createContribution, createServiceDecorator } from '@gepick/core/common';

export const QuickAccessContribution = Symbol('QuickAccessContribution');
/**
 * Bind this contribution in order to register quick access providers with the
 * QuickAccessRegistry at startup
 */
export interface QuickAccessContribution {
  registerQuickAccessProvider(): void;
}
export const [IQuickAccessContribution, IQuickAccessContributionProvider] = createContribution<IQuickAccessContribution>("QuickAccessContribution");
export type IQuickAccessContribution = QuickAccessContribution;
export type IQuickAccessContributionProvider = IContributionProvider<IQuickAccessContribution>;

export interface QuickAccessProvider {
  getPicks(filter: string, token: CancellationToken): QuickPicks | Promise<QuickPicks>;
  reset?(): void;
}

export interface QuickAccessProviderHelp {
  prefix?: string;
  description: string;
  needsEditor: boolean;
}

export interface QuickAccessProviderDescriptor {
  /**
     * return an instance of QuickAccessProvider. Implementers are free to return that same instance multiple times
     */
  readonly getInstance: () => QuickAccessProvider;
  /**
     * The prefix for quick access picker to use the provider for.
     */
  readonly prefix: string;
  /**
     * A placeholder to use for the input field when the provider is active.
     * This will also be read out by screen readers and thus helps for
     * accessibility.
     */
  readonly placeholder?: string;
  /**
     * Help entries for this quick access provider
     */
  readonly helpEntries: QuickAccessProviderHelp[];
  /**
     * A context key that will be set automatically when this quick access is being shown
     */
  readonly contextKey?: string;
}

export const QuickAccessRegistry = Symbol('QuickAccessRegistry');

/**
 * A registry for quick access providers.
 */
export interface QuickAccessRegistry {
  registerQuickAccessProvider(provider: QuickAccessProviderDescriptor): IDisposable;
  getQuickAccessProviders(): QuickAccessProviderDescriptor[];
  getQuickAccessProvider(prefix: string): QuickAccessProviderDescriptor | undefined;
  clear(): void;
}
export const IQuickAccessRegistry = createServiceDecorator<IQuickAccessRegistry>(QuickAccessRegistry);
export type IQuickAccessRegistry = QuickAccessRegistry;
