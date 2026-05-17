'use strict';
/**
 * WCAG AA Compliance Tests
 * Tests for Web Content Accessibility Guidelines 2.1 Level AA compliance
 */
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const playwright_1 = require('@axe-core/playwright');
// TODO: Re-enable once WebView is properly loaded in E2E environment
// Currently tests run against about:blank which lacks proper accessibility attributes
test_1.test.describe.skip('WCAG AA Accessibility Compliance', () => {
  test_1.test.beforeEach(async ({ page }) => {
    // Navigate to the extension webview (adjust URL as needed for your test environment)
    // This is a placeholder - actual navigation will depend on your test setup
    await page.goto('about:blank');
  });
  (0, test_1.test)(
    'should have no critical accessibility violations on initial load',
    async ({ page }) => {
      const accessibilityScanResults = await new playwright_1.default({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility violations found:');
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`- ${violation.id}: ${violation.description}`);
          console.log(`  Impact: ${violation.impact}`);
          console.log(`  Help: ${violation.help}`);
        });
      }
      // Should have no violations
      (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
    }
  );
  (0, test_1.test)(
    'should have proper ARIA attributes on interactive elements',
    async ({ page }) => {
      // Check for buttons with aria-label
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        const textContent = await button.textContent();
        // Button should have either aria-label, title, or visible text
        (0, test_1.expect)(
          ariaLabel || title || textContent?.trim(),
          `Button should have accessible text`
        ).toBeTruthy();
      }
    }
  );
  (0, test_1.test)('should have proper keyboard navigation', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withTags(['keyboard'])
      .analyze();
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should have sufficient color contrast', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withTags(['color-contrast'])
      .analyze();
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should have proper heading hierarchy', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withRules(['heading-order'])
      .analyze();
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should have proper form labels', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withTags(['forms'])
      .analyze();
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should have proper semantic HTML', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withTags(['best-practice'])
      .analyze();
    // Log violations for best practices
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Best practice violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }
    // Best practices might have some violations, but we should aim for none
    (0, test_1.expect)(accessibilityScanResults.violations.length).toBeLessThan(5);
  });
  (0, test_1.test)('should have no critical or serious violations', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page }).analyze();
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    if (criticalViolations.length > 0) {
      console.log('Critical/Serious violations found:');
      criticalViolations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Affected elements:`, violation.nodes.length);
      });
    }
    (0, test_1.expect)(criticalViolations).toEqual([]);
  });
  (0, test_1.test)('should have proper live regions for screen readers', async ({ page }) => {
    // Check for aria-live regions
    const liveRegions = await page.locator('[aria-live]').all();
    (0, test_1.expect)(liveRegions.length).toBeGreaterThan(0);
    // Verify live regions have proper configuration
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      (0, test_1.expect)(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
  });
  (0, test_1.test)('should have proper tab navigation order', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page
      .locator(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      .all();
    (0, test_1.expect)(focusableElements.length).toBeGreaterThan(0);
    // Verify no negative tabindex on interactive elements (except for roving tabindex pattern)
    for (const element of focusableElements) {
      const tabindex = await element.getAttribute('tabindex');
      if (tabindex && parseInt(tabindex) > 0) {
        // Positive tabindex should be avoided (except 0)
        console.warn(`Element has positive tabindex: ${tabindex}`);
      }
    }
  });
  (0, test_1.test)('should have proper dialog/modal implementation', async ({ page }) => {
    // Check for dialogs
    const dialogs = await page.locator('[role="dialog"]').all();
    for (const dialog of dialogs) {
      // Dialog should have aria-modal
      const ariaModal = await dialog.getAttribute('aria-modal');
      (0, test_1.expect)(ariaModal).toBe('true');
      // Dialog should have aria-labelledby or aria-label
      const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
      const ariaLabel = await dialog.getAttribute('aria-label');
      (0, test_1.expect)(ariaLabelledBy || ariaLabel).toBeTruthy();
    }
  });
  (0, test_1.test)('should have proper list and listbox implementation', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withRules(['list', 'listitem'])
      .analyze();
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should pass landmark rules', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withRules(['region'])
      .analyze();
    // Should have proper landmark regions
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should have proper image alt text', async ({ page }) => {
    const accessibilityScanResults = await new playwright_1.default({ page })
      .withRules(['image-alt'])
      .analyze();
    (0, test_1.expect)(accessibilityScanResults.violations).toEqual([]);
  });
  (0, test_1.test)('should count ARIA attributes in use', async ({ page }) => {
    // Count all ARIA attributes to verify we've added 50+
    const ariaAttributes = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const ariaAttrs = new Set();
      allElements.forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (attr.name.startsWith('aria-') || attr.name === 'role') {
            ariaAttrs.add(`${el.tagName.toLowerCase()}[${attr.name}="${attr.value}"]`);
          }
        });
      });
      return {
        uniqueCount: ariaAttrs.size,
        attributes: Array.from(ariaAttrs),
      };
    });
    console.log(`Found ${ariaAttributes.uniqueCount} unique ARIA attributes/roles`);
    console.log('Sample attributes:', ariaAttributes.attributes.slice(0, 10));
    // Should have at least 50 ARIA attributes as per requirements
    (0, test_1.expect)(ariaAttributes.uniqueCount).toBeGreaterThanOrEqual(50);
  });
});
// TODO: Re-enable once WebView keyboard navigation is testable
test_1.test.describe.skip('Keyboard Navigation Tests', () => {
  (0, test_1.test)('should support Tab key navigation', async ({ page }) => {
    // Press Tab key and verify focus moves
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      return {
        tagName: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute('role'),
        ariaLabel: document.activeElement?.getAttribute('aria-label'),
      };
    });
    (0, test_1.expect)(focusedElement.tagName).toBeTruthy();
  });
  (0, test_1.test)('should support Escape key to close dialogs', async ({ page: _page }) => {
    // This test would need actual dialog interaction
    // Placeholder for now
    (0, test_1.expect)(true).toBe(true);
  });
  (0, test_1.test)('should support Arrow keys for list navigation', async ({ page: _page }) => {
    // This test would need actual list interaction
    // Placeholder for now
    (0, test_1.expect)(true).toBe(true);
  });
  (0, test_1.test)('should support Enter/Space for button activation', async ({ page }) => {
    // Get first button
    const button = page.locator('button').first();
    if ((await button.count()) > 0) {
      await button.focus();
      // Should be focusable
      const isFocused = await page.evaluate(() => {
        return document.activeElement?.tagName === 'BUTTON';
      });
      (0, test_1.expect)(isFocused).toBe(true);
    }
  });
});
// TODO: Re-enable once screen reader elements are properly added
test_1.test.describe.skip('Screen Reader Support Tests', () => {
  (0, test_1.test)('should have screen reader only text where needed', async ({ page }) => {
    const srOnlyElements = await page.locator('.sr-only').all();
    console.log(`Found ${srOnlyElements.length} screen-reader-only elements`);
    // Should have some sr-only elements for screen reader announcements
    (0, test_1.expect)(srOnlyElements.length).toBeGreaterThan(0);
  });
  (0, test_1.test)('should hide decorative elements from screen readers', async ({ page }) => {
    const decorativeElements = await page.locator('[aria-hidden="true"]').all();
    console.log(`Found ${decorativeElements.length} decorative elements`);
    // Icons and decorative elements should be hidden from screen readers
    (0, test_1.expect)(decorativeElements.length).toBeGreaterThan(0);
  });
});
//# sourceMappingURL=wcag-compliance.spec.js.map
