import { test, expect } from '@playwright/test';
import { sectionsData as sections } from '../src/content/sections/sectionsData';

// Helper to collect console and page errors
function collectErrors(page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('Site loads without console errors', () => {
  test('homepage', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(errors).toEqual([]);
  });

  // Test each main section and its subsections
  for (const section of sections) {
    test(`Section: ${section.id}`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(`/${section.id}`, { waitUntil: 'networkidle' });
      expect(errors).toEqual([]);
    });
    if (section.subsections) {
      for (const sub of section.subsections) {
        test(`Subsection: ${section.id}/${sub.id}`, async ({ page }) => {
          const errors = collectErrors(page);
          await page.goto(`/${section.id}/${sub.id}`, { waitUntil: 'networkidle' });
          expect(errors).toEqual([]);
        });
      }
    }
  }
});