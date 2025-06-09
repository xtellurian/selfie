import { html, define } from 'hybrids';
import './pages/alice-page.js';
import './pages/bob-page.js';

// Navigation state manager
const Navigation = {
  currentPage: 'alice',
  alicePage: ({ currentPage }) => document.querySelector('alice-page'),
  bobPage: ({ currentPage }) => document.querySelector('bob-page'),
  connect: (host, key) => {
    // Set up event listeners for navigation
    const setupNavigation = () => {
      const aliceGoToBobBtn = document.querySelector('[data-testid="go-to-bob-button"]');
      const bobGoToAliceBtn = document.querySelector('[data-testid="go-to-alice-button"]');
      
      if (aliceGoToBobBtn) {
        aliceGoToBobBtn.addEventListener('click', () => {
          host.currentPage = 'bob';
          updatePageVisibility(host);
        });
      }
      
      if (bobGoToAliceBtn) {
        bobGoToAliceBtn.addEventListener('click', () => {
          host.currentPage = 'alice';
          updatePageVisibility(host);
        });
      }
    };

    // Wait for components to be defined and DOM to be ready
    setTimeout(setupNavigation, 100);
    
    // Initial page setup
    updatePageVisibility(host);
  },
  render: ({ currentPage }) => html`
    <div class="app">
      <nav class="navigation">
        <h2>Selfie Frontend</h2>
        <p>Current page: ${currentPage}</p>
      </nav>
    </div>
  `,
};

function updatePageVisibility(host) {
  const alicePage = document.querySelector('alice-page');
  const bobPage = document.querySelector('bob-page');
  
  if (alicePage && bobPage) {
    alicePage.visible = host.currentPage === 'alice';
    bobPage.visible = host.currentPage === 'bob';
  }
}

define('app-navigation', Navigation);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Set initial page visibility
  const alicePage = document.querySelector('alice-page');
  const bobPage = document.querySelector('bob-page');
  
  if (alicePage && bobPage) {
    alicePage.visible = true;
    bobPage.visible = false;
  }
  
  // Setup navigation after a brief delay to ensure components are ready
  setTimeout(() => {
    const aliceGoToBobBtn = document.querySelector('[data-testid="go-to-bob-button"]');
    const bobGoToAliceBtn = document.querySelector('[data-testid="go-to-alice-button"]');
    
    if (aliceGoToBobBtn) {
      aliceGoToBobBtn.addEventListener('click', () => {
        const alicePage = document.querySelector('alice-page');
        const bobPage = document.querySelector('bob-page');
        
        if (alicePage && bobPage) {
          alicePage.visible = false;
          bobPage.visible = true;
        }
      });
    }
    
    if (bobGoToAliceBtn) {
      bobGoToAliceBtn.addEventListener('click', () => {
        const alicePage = document.querySelector('alice-page');
        const bobPage = document.querySelector('bob-page');
        
        if (alicePage && bobPage) {
          alicePage.visible = true;
          bobPage.visible = false;
        }
      });
    }
  }, 200);
});