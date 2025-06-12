
/**
 * Frontend Application Entry Point
 * 
 * This file imports and initializes all TypeScript components
 * for the Selfie Frontend application.
 */

// Import all components to register them as custom elements
import '../components/alice-page.js';
import '../components/bob-page.js';
import '../components/chat-interface.js';

// Initialize application
class SelfieApp {
  private currentPage: 'alice' | 'bob' = 'alice';

  constructor() {
    this.initializeRouting();
    this.initializeNavigation();
    this.setupGlobalErrorHandling();
  }

  private initializeRouting(): void {
    // Handle initial route
    this.handleRoute();
    
    // Handle browser navigation
    window.addEventListener('popstate', () => this.handleRoute());
  }

  private handleRoute(): void {
    const path = window.location.pathname;
    const alicePage = document.querySelector('alice-page');
    const bobPage = document.querySelector('bob-page');

    if (path === '/bob' || path.includes('bob')) {
      this.currentPage = 'bob';
      alicePage?.setAttribute('visible', 'false');
      bobPage?.setAttribute('visible', 'true');
    } else {
      this.currentPage = 'alice';
      alicePage?.setAttribute('visible', 'true');
      bobPage?.setAttribute('visible', 'false');
    }
  }

  private initializeNavigation(): void {
    // Listen for navigation events from components
    document.addEventListener('navigate', (event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.page) {
        this.navigateTo(detail.page);
      }
    });
  }

  private navigateTo(page: 'alice' | 'bob'): void {
    const url = page === 'alice' ? '/' : '/bob';
    history.pushState(null, '', url);
    this.handleRoute();
  }

  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SelfieApp();
  });
} else {
  new SelfieApp();
}

// Export for potential use
export default SelfieApp;
