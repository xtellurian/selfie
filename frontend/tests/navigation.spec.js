import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Alice page by default', async ({ page }) => {
    // Alice page should be visible
    const alicePage = page.getByTestId('alice-page');
    await expect(alicePage).toBeVisible();
    
    // Bob page should not be visible
    const bobPage = page.getByTestId('bob-page');
    await expect(bobPage).not.toBeVisible();
    
    // Check Alice page content
    await expect(page.getByRole('heading', { name: "Alice's Page" })).toBeVisible();
    await expect(page.getByText('Welcome to Alice\'s page!')).toBeVisible();
  });

  test('should navigate from Alice to Bob page', async ({ page }) => {
    // Start on Alice page
    const alicePage = page.getByTestId('alice-page');
    await expect(alicePage).toBeVisible();
    
    // Take screenshot of Alice page
    await page.screenshot({ path: 'frontend/tests/screenshots/alice-page.png' });
    
    // Click navigation button
    const goToBobButton = page.getByTestId('go-to-bob-button');
    await expect(goToBobButton).toBeVisible();
    await goToBobButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(100);
    
    // Verify Bob page is now visible
    const bobPage = page.getByTestId('bob-page');
    await expect(bobPage).toBeVisible();
    
    // Verify Alice page is hidden
    await expect(alicePage).not.toBeVisible();
    
    // Check Bob page content
    await expect(page.getByRole('heading', { name: "Bob's Page" })).toBeVisible();
    await expect(page.getByText('Welcome to Bob\'s page!')).toBeVisible();
    
    // Take screenshot of Bob page
    await page.screenshot({ path: 'frontend/tests/screenshots/bob-page.png' });
  });

  test('should navigate from Bob to Alice page', async ({ page }) => {
    // Start on Alice page and navigate to Bob
    const goToBobButton = page.getByTestId('go-to-bob-button');
    await goToBobButton.click();
    await page.waitForTimeout(100);
    
    // Verify we're on Bob page
    const bobPage = page.getByTestId('bob-page');
    await expect(bobPage).toBeVisible();
    
    // Click navigation button to go back to Alice
    const goToAliceButton = page.getByTestId('go-to-alice-button');
    await expect(goToAliceButton).toBeVisible();
    await goToAliceButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(100);
    
    // Verify Alice page is now visible
    const alicePage = page.getByTestId('alice-page');
    await expect(alicePage).toBeVisible();
    
    // Verify Bob page is hidden
    await expect(bobPage).not.toBeVisible();
    
    // Check Alice page content
    await expect(page.getByRole('heading', { name: "Alice's Page" })).toBeVisible();
  });

  test('should display correct features for each page', async ({ page }) => {
    // Test Alice's features
    await expect(page.getByText('Monitor Selfie agent status')).toBeVisible();
    await expect(page.getByText('Create new development tasks')).toBeVisible();
    await expect(page.getByText('View active MCP connections')).toBeVisible();
    
    // Navigate to Bob's page
    await page.getByTestId('go-to-bob-button').click();
    await page.waitForTimeout(100);
    
    // Test Bob's features
    await expect(page.getByText('Coordinate multiple Selfie instances')).toBeVisible();
    await expect(page.getByText('Review pull requests and code changes')).toBeVisible();
    await expect(page.getByText('Manage development task queues')).toBeVisible();
  });

  test('should capture screenshots for visual validation', async ({ page }) => {
    // Create screenshots directory
    await page.evaluate(() => {
      // This will be handled by the test runner
    });
    
    // Alice page screenshot
    await page.screenshot({ 
      path: 'frontend/tests/screenshots/alice-initial.png',
      fullPage: true 
    });
    
    // Navigate and screenshot Bob page
    await page.getByTestId('go-to-bob-button').click();
    await page.waitForTimeout(100);
    await page.screenshot({ 
      path: 'frontend/tests/screenshots/bob-initial.png',
      fullPage: true 
    });
    
    // Navigate back and screenshot Alice again
    await page.getByTestId('go-to-alice-button').click();
    await page.waitForTimeout(100);
    await page.screenshot({ 
      path: 'frontend/tests/screenshots/alice-return.png',
      fullPage: true 
    });
  });
});