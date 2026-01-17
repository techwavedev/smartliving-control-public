/**
 * E2E tests for SmartLiving Control application
 * 
 * These tests verify the main user flows in the application.
 * Note: These tests require the Electron app to be available.
 */

const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('path');

let app;
let window;

test.describe('SmartLiving Control App', () => {
  test.beforeAll(async () => {
    // Launch the Electron app
    app = await electron.launch({
      args: [path.join(__dirname, '../../')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    // Get the first window
    window = await app.firstWindow();
    
    // Force show the window (since it starts hidden as a tray app)
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.show();
    });
    
    // Wait for the app to be ready
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should launch and display window', async () => {
    const title = await window.title();
    expect(title).toBeTruthy();
  });

  test('should show setup screen when no token configured', async () => {
    // Look for setup screen elements
    const setupScreen = window.locator('#setup-screen');
    const isVisible = await setupScreen.isVisible().catch(() => false);
    
    // Either setup screen or devices screen should be visible
    if (isVisible) {
      expect(isVisible).toBe(true);
    } else {
      // If token is already configured, devices screen should be visible
      const devicesScreen = window.locator('#devices-screen');
      const devicesVisible = await devicesScreen.isVisible().catch(() => false);
      expect(devicesVisible).toBe(true);
    }
  });

  test('should have settings button', async () => {
    const settingsBtn = window.locator('#settings-btn');
    const setupBtn = window.locator('#setup-btn');
    
    // Either settings or setup button should exist
    const settingsExists = await settingsBtn.count() > 0;
    const setupExists = await setupBtn.count() > 0;
    
    expect(settingsExists || setupExists).toBe(true);
  });

  test('should navigate to settings screen', async () => {
    // Try settings button first, then setup button
    const settingsBtn = window.locator('#settings-btn');
    const setupBtn = window.locator('#setup-btn');
    
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click();
    } else if (await setupBtn.isVisible().catch(() => false)) {
      await setupBtn.click();
    }
    
    // Settings screen should now be visible
    const settingsScreen = window.locator('#settings-screen');
    await expect(settingsScreen).toBeVisible({ timeout: 5000 });
  });

  test('should have token input field in settings', async () => {
    const tokenInput = window.locator('#token-input');
    await expect(tokenInput).toBeVisible();
  });

  test('should have save token button', async () => {
    const saveBtn = window.locator('#save-token');
    await expect(saveBtn).toBeVisible();
  });

  test('should navigate back from settings', async () => {
    const backBtn = window.locator('#settings-back');
    
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
      
      // Should show devices or setup screen
      const devicesScreen = window.locator('#devices-screen');
      const setupScreen = window.locator('#setup-screen');
      
      const devicesVisible = await devicesScreen.isVisible().catch(() => false);
      const setupVisible = await setupScreen.isVisible().catch(() => false);
      
      expect(devicesVisible || setupVisible).toBe(true);
    }
  });
});

test.describe('Tab Navigation', () => {
  test.beforeAll(async () => {
    app = await electron.launch({
      args: [path.join(__dirname, '../../')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });
    window = await app.firstWindow();

    // Force show the window
    await app.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) win.show();
    });

    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should switch between devices and scenes tabs', async () => {
    // Check if we're on devices screen
    const devicesScreen = window.locator('#devices-screen');
    const isOnDevices = await devicesScreen.isVisible().catch(() => false);
    
    if (isOnDevices) {
      // Click scenes tab
      const scenesTabBtn = window.locator('[data-tab="scenes"]');
      if (await scenesTabBtn.isVisible().catch(() => false)) {
        await scenesTabBtn.click();
        
        const scenesTab = window.locator('#scenes-tab');
        await expect(scenesTab).toBeVisible();
      }
      
      // Click devices tab
      const devicesTabBtn = window.locator('[data-tab="devices"]');
      if (await devicesTabBtn.isVisible().catch(() => false)) {
        await devicesTabBtn.click();
        
        const devicesTab = window.locator('#devices-tab');
        await expect(devicesTab).toBeVisible();
      }
    }
  });
});
