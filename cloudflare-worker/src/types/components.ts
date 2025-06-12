/**
 * Frontend Component Types
 */

/**
 * Base component interface for all web components
 */
export interface BaseComponent extends HTMLElement {
  render(): void;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

/**
 * Component state interface
 */
export interface ComponentState {
  readonly [key: string]: unknown;
}

/**
 * Navigation state
 */
export interface NavigationState {
  readonly currentPage: 'alice' | 'bob';
  readonly previousPage?: 'alice' | 'bob';
  readonly navigationHistory: readonly string[];
}

/**
 * Page component properties
 */
export interface PageComponentProps {
  readonly visible: boolean;
  readonly data?: Record<string, unknown>;
}

/**
 * Agent card data for display
 */
export interface AgentCardData {
  readonly name: string;
  readonly emoji: string;
  readonly status: 'monitoring' | 'available' | 'busy' | 'idle' | 'offline';
  readonly description: string;
  readonly lastActivity?: string;
}

/**
 * Status card configuration
 */
export interface StatusCardConfig {
  readonly title: string;
  readonly icon: string;
  readonly status: 'loading' | 'success' | 'warning' | 'error';
  readonly message: string;
  readonly details?: string;
}

/**
 * Custom element registry interface
 */
export interface CustomElementRegistry {
  define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions): void;
  get(name: string): CustomElementConstructor | undefined;
  whenDefined(name: string): Promise<CustomElementConstructor>;
}

/**
 * Event handler types
 */
export type EventHandler<T = Event> = (event: T) => void | Promise<void>;

/**
 * Component lifecycle methods
 */
export interface ComponentLifecycle {
  onMount?(): void | Promise<void>;
  onUnmount?(): void | Promise<void>;
  onUpdate?(changes: Record<string, unknown>): void | Promise<void>;
}