/**
 * Base Component Class for Web Components
 */

import type { BaseComponent, ComponentState, EventHandler } from '@/types/components.js';

/**
 * Abstract base class for all Selfie web components
 */
export abstract class SelfieBaseComponent extends HTMLElement implements BaseComponent {
  protected shadow: ShadowRoot;
  protected state: ComponentState = {};
  private eventListeners: Map<string, EventHandler[]> = new Map();

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  /**
   * Component lifecycle: Called when element is added to DOM
   */
  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
    this.onMount?.();
  }

  /**
   * Component lifecycle: Called when element is removed from DOM
   */
  disconnectedCallback(): void {
    this.removeEventListeners();
    this.onUnmount?.();
  }

  /**
   * Component lifecycle: Called when attributes change
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue) {
      this.onAttributeChange?.(name, oldValue, newValue);
      this.render();
    }
  }

  /**
   * Abstract method: Each component must implement its own render logic
   */
  abstract render(): void;

  /**
   * Update component state and trigger re-render
   */
  protected setState(newState: Partial<ComponentState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange?.(this.state, oldState);
    this.render();
  }

  /**
   * Get current component state
   */
  protected getState(): Readonly<ComponentState> {
    return { ...this.state };
  }

  /**
   * Add event listener with automatic cleanup
   */
  protected addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: EventHandler<HTMLElementEventMap[K]>,
    selector?: string
  ): void {
    const wrappedHandler = (event: HTMLElementEventMap[K]) => {
      if (selector) {
        const target = event.target as HTMLElement;
        if (target.matches && target.matches(selector)) {
          handler(event);
        }
      } else {
        handler(event);
      }
    };

    const handlers = this.eventListeners.get(type) || [];
    handlers.push(wrappedHandler as EventHandler);
    this.eventListeners.set(type, handlers);

    this.shadow.addEventListener(type, wrappedHandler as EventListener);
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    for (const [type, handlers] of this.eventListeners) {
      handlers.forEach(handler => {
        this.shadow.removeEventListener(type, handler as EventListener);
      });
    }
    this.eventListeners.clear();
  }

  /**
   * Attach component-specific event listeners
   */
  protected attachEventListeners(): void {
    // Override in subclasses to add specific event listeners
  }

  /**
   * Create and return styled template
   */
  protected createTemplate(html: string, css: string = ''): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = `
      ${css ? `<style>${css}</style>` : ''}
      ${html}
    `;
    return template.content.cloneNode(true) as DocumentFragment;
  }

  /**
   * Query element in shadow DOM
   */
  protected querySelector<T extends HTMLElement>(selector: string): T | null {
    return this.shadow.querySelector(selector) as T | null;
  }

  /**
   * Query all elements in shadow DOM
   */
  protected querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return this.shadow.querySelectorAll(selector) as NodeListOf<T>;
  }

  /**
   * Emit custom event
   */
  protected emit(eventName: string, detail?: unknown): void {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  // Optional lifecycle hooks
  protected onMount?(): void | Promise<void>;
  protected onUnmount?(): void | Promise<void>;
  protected onStateChange?(newState: ComponentState, oldState: ComponentState): void | Promise<void>;
  protected onAttributeChange?(name: string, oldValue: string | null, newValue: string | null): void;
}