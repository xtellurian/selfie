/**
 * Frontend Build Script
 * 
 * Builds the TypeScript frontend components into a bundled JavaScript file
 * that can be included in the HTML
 */

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🏗️  Building Selfie Frontend...');

try {
  // Ensure public directory exists
  mkdirSync(resolve(projectRoot, 'public'), { recursive: true });

  // Create frontend entry point
  const frontendEntryPath = resolve(projectRoot, 'src/frontend/app.ts');
  mkdirSync(dirname(frontendEntryPath), { recursive: true });
  
  const frontendEntry = `
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
`;

  writeFileSync(frontendEntryPath, frontendEntry);

  // Build the frontend bundle
  await build({
    entryPoints: [frontendEntryPath],
    bundle: true,
    format: 'esm',
    target: 'es2022',
    outfile: resolve(projectRoot, 'public/app.js'),
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    logLevel: 'info',
    external: [], // Bundle everything
  });

  // Copy the template to public directory (don't modify inline scripts)
  const templatePath = resolve(projectRoot, 'src/templates/index.html');
  const htmlPath = resolve(projectRoot, 'public/index.html');
  
  // Simply copy the template - it already has the correct script tag
  const htmlContent = readFileSync(templatePath, 'utf8');
  writeFileSync(htmlPath, htmlContent);

  console.log('✅ Frontend build completed successfully!');
  console.log('📦 Bundle: public/app.js');
  console.log('🌐 HTML: public/index.html');

} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}