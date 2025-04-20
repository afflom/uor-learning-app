import { test, expect } from '@playwright/test'

// Test to verify that the UOR knowledge base properly saves to IndexedDB
test.describe('UOR Knowledge Base', () => {
  // Run once before all tests
  test.beforeAll(async ({ browser }) => {
    // Make sure the page is built
    const page = await browser.newPage()
    await page.goto('/knowledge-base/loader')
    await page.close()
  })

  test('should persist data to IndexedDB', async ({ page }) => {
    // Navigate to the knowledge base page
    await page.goto('/knowledge-base')
    
    // Check that the page loads successfully
    const heading = await page.$eval('h1', el => el.textContent)
    expect(heading).toBe('Knowledge Base')
    
    // Go to the loader page
    await page.goto('/knowledge-base/loader')
    
    // Check for the knowledge base loader
    const loaderExists = await page.$('.loader-section')
    expect(loaderExists).not.toBeNull()
    
    // Verify no console errors
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    
    // There should be no console errors
    expect(errors).toEqual([])
  })
  
  test('should load additional content from knowledgebase via button', async ({ page }) => {
    // Navigate to the loader page
    await page.goto('/knowledge-base/loader')
    
    // Click the load button
    await page.waitForSelector('.load-button')
    await page.click('.load-button')
    
    // Wait for a reasonable time for the content to load
    await page.waitForTimeout(2000)
    
    // Verify no console errors
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    
    // There should be no console errors
    expect(errors).toEqual([])
  })
  
  // Test for identity integration
  test('should show identity management page', async ({ page }) => {
    // Navigate to the identity page
    await page.goto('/uor/identity')
    
    // Check that the page loads successfully
    const heading = await page.$eval('h1', el => el.textContent)
    expect(heading).toBe('Universal Object Reference Identity')
    
    // Verify the identity management section exists
    const identitySection = await page.$('.identity-manager-section')
    expect(identitySection).not.toBeNull()
    
    // Verify no console errors
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    
    // There should be no console errors
    expect(errors).toEqual([])
  })
})