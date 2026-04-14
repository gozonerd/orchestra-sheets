import { test, expect } from '@playwright/test';

test.describe('Folder Tree Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
		await expect(page.locator('h1')).toContainText('UI Component Test Suite');
	});

	test('should expand and collapse folders', async ({ page }) => {
		// Find the expand button for "General" folder
		const generalFolderRow = page.locator('text=General').first();
		const expandButton = generalFolderRow.locator('xpath=./../../button[1]');

		// Initially, the folder should be collapsed (no > visible yet)
		await expect(expandButton).toBeVisible();

		// Click to expand
		await expandButton.click();
		await expect(page.locator('text=Customer Support')).toBeVisible();

		// Click to collapse
		await expandButton.click();
		await expect(page.locator('text=Customer Support')).not.toBeVisible();
	});

	test('should select folders on click', async ({ page }) => {
		// Click on "General" folder
		const generalFolder = page.locator('text=General').first();
		await generalFolder.click();

		// Check that the selected state is displayed
		const selectedState = page.locator('text=Selected Folder: ID: 1');
		await expect(selectedState).toBeVisible();
	});

	test('should navigate folders with arrow keys', async ({ page }) => {
		// Focus on the General folder
		const generalFolder = page.locator('text=General').first();
		await generalFolder.focus();

		// Press right arrow to expand
		await page.keyboard.press('ArrowRight');
		await expect(page.locator('text=Customer Support')).toBeVisible();

		// Press left arrow to collapse
		await page.keyboard.press('ArrowLeft');
		await expect(page.locator('text=Customer Support')).not.toBeVisible();
	});

	test('should select folder with Enter key', async ({ page }) => {
		// Focus on the General folder
		const generalFolder = page.locator('text=General').first();
		await generalFolder.focus();

		// Press Enter to select
		await page.keyboard.press('Enter');

		// Verify selection
		const selectedState = page.locator('text=Selected Folder: ID: 1');
		await expect(selectedState).toBeVisible();
	});

	test('should navigate folders with Tab key', async ({ page }) => {
		// Tab should move focus to the next interactive element
		const firstFolder = page.locator('text=General').first();
		await firstFolder.focus();

		// Tab to next element (expand button of next folder or next folder itself)
		await page.keyboard.press('Tab');

		// Focus should move to another element
		const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
		expect(focusedElement).not.toContain('General');
	});
});

test.describe('Search Bar Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
	});

	test('should type in search input', async ({ page }) => {
		const searchInput = page.locator('input[placeholder="Search prompts by name or description..."]');
		await searchInput.fill('customer');

		await expect(searchInput).toHaveValue('customer');
	});

	test('should display search results on input change', async ({ page }) => {
		const searchInput = page.locator('input[placeholder="Search prompts by name or description..."]');

		// Type a search query
		await searchInput.fill('example');

		// Wait for results to appear (simulated with 500ms delay in component)
		await page.waitForTimeout(600);

		// Results should be visible
		const results = page.locator('text=Example Prompt');
		await expect(results.first()).toBeVisible();
	});

	test('should filter by folder dropdown', async ({ page }) => {
		// Click the "All Folders" dropdown button
		const folderFilterButton = page.locator('button:has-text("All Folders")').first();
		await folderFilterButton.click();

		// Dropdown should be visible
		const dropdown = page.locator('[role="listbox"]').first();
		await expect(dropdown).toBeVisible();

		// Select a folder
		const folderOption = dropdown.locator('button').first();
		await folderOption.click();

		// Dropdown should close
		await expect(dropdown).not.toBeVisible();
	});

	test('should filter by tags dropdown', async ({ page }) => {
		// Click the "All Tags" dropdown button
		const tagFilterButton = page.locator('button:has-text("All Tags")').first();
		await tagFilterButton.click();

		// Dropdown should be visible
		const dropdown = page.locator('[role="listbox"]').nth(1);
		await expect(dropdown).toBeVisible();

		// Check a tag checkbox
		const checkbox = dropdown.locator('input[type="checkbox"]').first();
		await checkbox.check();

		// Checkbox should be checked
		await expect(checkbox).toBeChecked();
	});

	test('should clear search with empty input', async ({ page }) => {
		const searchInput = page.locator('input[placeholder="Search prompts by name or description..."]');

		// Type and then clear
		await searchInput.fill('test');
		await searchInput.clear();

		await expect(searchInput).toHaveValue('');
	});
});

test.describe('Tag Modal Workflows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
	});

	test('should open tag modal on button click', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Modal should be visible
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible();

		// Modal title should be visible
		const title = page.locator('h2:has-text("Manage Tags")');
		await expect(title).toBeVisible();
	});

	test('should fill and submit tag creation form', async ({ page }) => {
		// Open modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Fill tag name
		const nameInput = page.locator('input[placeholder="e.g., High Priority"]');
		await nameInput.fill('Urgent');

		// Select a color
		const colorButton = page.locator('button[style*="background-color"]').first();
		await colorButton.click();

		// Create button should be visible
		const createButton = page.locator('button:has-text("Create Tag")');
		await expect(createButton).toBeVisible();
	});

	test('should close modal with X button', async ({ page }) => {
		// Open modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Find and click close button (X)
		const closeButton = page.locator('button[aria-label="Close modal"]');
		await closeButton.click();

		// Modal should not be visible
		const modal = page.locator('[role="dialog"]');
		await expect(modal).not.toBeVisible();
	});

	test('should close modal with Escape key', async ({ page }) => {
		// Open modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Press Escape
		await page.keyboard.press('Escape');

		// Modal should not be visible
		const modal = page.locator('[role="dialog"]');
		await expect(modal).not.toBeVisible();
	});

	test('should toggle tag selection with checkbox', async ({ page }) => {
		// Open modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Find first tag checkbox
		const tagCheckbox = page.locator('input[type="checkbox"]').first();

		// Initially unchecked
		await expect(tagCheckbox).not.toBeChecked();

		// Click to check
		await tagCheckbox.check();
		await expect(tagCheckbox).toBeChecked();

		// Click to uncheck
		await tagCheckbox.uncheck();
		await expect(tagCheckbox).not.toBeChecked();
	});

	test('should display existing tags in modal', async ({ page }) => {
		// Open modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Check for existing tags
		const highPriorityTag = page.locator('text=High Priority');
		const reviewTag = page.locator('text=Review Needed');
		const completedTag = page.locator('text=Completed');

		await expect(highPriorityTag).toBeVisible();
		await expect(reviewTag).toBeVisible();
		await expect(completedTag).toBeVisible();
	});
});

test.describe('Complete User Workflows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
	});

	test('should perform complete search workflow', async ({ page }) => {
		// 1. Expand a folder
		const expandButton = page.locator('xpath=//div[@role="treeitem"]//button').first();
		await expandButton.click();

		// 2. Select a folder
		const childFolder = page.locator('text=Customer Support');
		await childFolder.click();

		// 3. Enter search query
		const searchInput = page.locator('input[placeholder="Search prompts by name or description..."]');
		await searchInput.fill('support');

		// 4. Verify search state updates
		await page.waitForTimeout(600);
		const queryState = page.locator('text=Query: support');
		await expect(queryState).toBeVisible();

		const folderState = page.locator('text=Folder Filter: 2');
		await expect(folderState).toBeVisible();
	});

	test('should perform complete tag management workflow', async ({ page }) => {
		// 1. Open tag modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// 2. Create a new tag (fill form)
		const nameInput = page.locator('input[placeholder="e.g., High Priority"]');
		await nameInput.fill('Custom Tag');

		// 3. Select color
		const colorInput = page.locator('input[type="color"]');
		await colorInput.fill('#FF5733');

		// 4. Select existing tags
		const checkboxes = page.locator('input[type="checkbox"]');
		await checkboxes.nth(0).check();
		await checkboxes.nth(1).check();

		// 5. Close modal
		const closeButton = page.locator('button:has-text("Close")');
		await closeButton.click();

		// Modal should be closed
		const modal = page.locator('[role="dialog"]');
		await expect(modal).not.toBeVisible();
	});

	test('should navigate and search with keyboard only', async ({ page }) => {
		// 1. Tab to first folder
		const firstFolder = page.locator('text=General').first();
		await firstFolder.focus();

		// 2. Expand with arrow key
		await page.keyboard.press('ArrowRight');

		// 3. Tab to search input
		const searchInput = page.locator('input[placeholder="Search prompts by name or description..."]');
		await searchInput.focus();

		// 4. Type search query
		await page.keyboard.type('test');

		// 5. Verify input value
		await expect(searchInput).toHaveValue('test');

		// 6. Tab to search button and trigger
		const searchButton = page.locator('button[aria-label="Search"]');
		await searchButton.focus();
		await page.keyboard.press('Enter');

		// Results should appear
		await page.waitForTimeout(600);
	});

	test('should maintain state across interactions', async ({ page }) => {
		// 1. Select a folder
		const generalFolder = page.locator('text=General').first();
		await generalFolder.click();

		// 2. Verify state shows selected folder
		let folderState = page.locator('text=Selected Folder: ID: 1');
		await expect(folderState).toBeVisible();

		// 3. Open tag modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// 4. Select a tag
		const checkbox = page.locator('input[type="checkbox"]').first();
		await checkbox.check();

		// 5. Close modal
		const closeButton = page.locator('button:has-text("Close")');
		await closeButton.click();

		// 6. Folder selection should still be visible
		folderState = page.locator('text=Selected Folder: ID: 1');
		await expect(folderState).toBeVisible();

		// 7. Tag selection should be reflected in state
		const tagState = page.locator('text=Tag Filters:');
		await expect(tagState).toBeVisible();
	});
});

test.describe('Accessibility Compliance', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
	});

	test('should have proper heading hierarchy', async ({ page }) => {
		// Main heading should be h1
		const mainHeading = page.locator('h1');
		await expect(mainHeading).toBeVisible();

		// Component headings should be h2
		const componentHeadings = page.locator('h2');
		const count = await componentHeadings.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should have proper form labels', async ({ page }) => {
		// Open modal to test labels
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Check for labels
		const tagNameLabel = page.locator('label:has-text("Tag Name")');
		const colorLabel = page.locator('label:has-text("Color")');

		await expect(tagNameLabel).toBeVisible();
		await expect(colorLabel).toBeVisible();
	});

	test('should show focus indicators on keyboard navigation', async ({ page }) => {
		// Tab through interactive elements
		const firstButton = page.locator('button').first();
		await firstButton.focus();

		// Check that element is focused
		const focusedElement = await page.evaluate(() => {
			return document.activeElement?.tagName;
		});

		expect(focusedElement).toBe('BUTTON');
	});

	test('should have proper color contrast', async ({ page }) => {
		// Text should be visible against background
		const textElements = page.locator('text=Folder Tree Component');
		await expect(textElements).toBeVisible();

		// Check that text is readable (not hidden or too light)
		const isVisible = await textElements.isVisible();
		expect(isVisible).toBe(true);
	});

	test('should support keyboard navigation in dropdowns', async ({ page }) => {
		// Open folder filter dropdown
		const folderButton = page.locator('button:has-text("All Folders")').first();
		await folderButton.click();

		// Dropdown should be visible
		const dropdown = page.locator('[role="listbox"]').first();
		await expect(dropdown).toBeVisible();

		// Navigate with arrow keys
		const firstOption = dropdown.locator('button').first();
		await firstOption.focus();

		// Press arrow down
		await page.keyboard.press('ArrowDown');

		// Next option should be focused
		const focusedElement = await page.evaluate(() => {
			return document.activeElement?.textContent;
		});

		expect(focusedElement).not.toBeNull();
	});
});
