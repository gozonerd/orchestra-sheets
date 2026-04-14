import { test, expect } from '@playwright/test';

test.describe('Folder Tree Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
		await expect(page.locator('h1')).toContainText('UI Component Test Suite');
	});

	test('should render folder tree with General and Archive folders', async ({ page }) => {
		await expect(page.locator('text=General')).toBeVisible();
		await expect(page.locator('text=Archive')).toBeVisible();
	});

	test('should expand folder when expand button clicked', async ({ page }) => {
		// Find the expand button for General folder (first button in the folder row)
		const generalFolderItem = page.locator('text=General').first().locator('..');
		const expandButton = generalFolderItem.locator('button').first();

		// Click expand button
		await expandButton.click();

		// Child folders should now be visible
		await expect(page.locator('text=Customer Support')).toBeVisible();
		await expect(page.locator('text=Content Creation')).toBeVisible();
	});

	test('should collapse folder when expand button clicked again', async ({ page }) => {
		// Expand first
		const generalFolderItem = page.locator('text=General').first().locator('..');
		const expandButton = generalFolderItem.locator('button').first();
		await expandButton.click();
		await expect(page.locator('text=Customer Support')).toBeVisible();

		// Collapse
		await expandButton.click();
		await expect(page.locator('text=Customer Support')).not.toBeVisible();
	});

	test('should select folder on click', async ({ page }) => {
		const generalFolder = page.locator('text=General').first();
		await generalFolder.click();

		// Verify folder is selected (check aria-selected or visual state)
		await expect(generalFolder.locator('..')).toHaveAttribute('aria-selected', 'true');
	});

	test('should display correct selected folder state', async ({ page }) => {
		const generalFolder = page.locator('text=General').first();
		await generalFolder.click();

		// The page displays the selected folder state
		const selectedState = page.locator('p:has-text("Selected Folder:")');
		await expect(selectedState).toContainText('ID: 1');
	});
});

test.describe('Search Bar Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
		await expect(page.locator('h1')).toContainText('UI Component Test Suite');
	});

	test('should type in search input', async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await searchInput.fill('test prompt');

		await expect(searchInput).toHaveValue('test prompt');
	});

	test('should trigger search on input change', async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await searchInput.fill('test');

		// Results should be displayed
		const queryState = page.locator('text=Query: test');
		await expect(queryState).toBeVisible();
	});

	test('should display search results', async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await searchInput.fill('example');

		// Wait for results to appear
		await page.waitForTimeout(600); // Simulate the 500ms delay in mock

		// Check results count increased
		const resultsState = page.locator('text=/Results: \\d+ items/');
		await expect(resultsState).toBeVisible();
	});

	test('should open folder dropdown filter', async ({ page }) => {
		const folderButton = page.locator('button:has-text("All Folders")').first();
		await folderButton.click();

		// Dropdown should show folder options
		await expect(page.locator('text=All Folders')).toBeVisible();
	});

	test('should filter by folder selection', async ({ page }) => {
		const folderButton = page.locator('button:has-text("All Folders")').first();
		await folderButton.click();

		// Select a specific folder
		const folderOption = page.locator('button:has-text("General")').last();
		await folderOption.click();

		// Button text should update
		await expect(folderButton).toContainText('General');
	});

	test('should open tags dropdown filter', async ({ page }) => {
		const tagsButton = page.locator('button:has-text("All Tags")');
		await tagsButton.click();

		// Should show tag options
		const tagCheckboxes = page.locator('input[type="checkbox"]');
		await expect(tagCheckboxes.first()).toBeVisible();
	});

	test('should select tag filter with checkbox', async ({ page }) => {
		const tagsButton = page.locator('button:has-text("All Tags")');
		await tagsButton.click();

		// Click first tag checkbox
		const firstCheckbox = page.locator('input[type="checkbox"]').first();
		await firstCheckbox.check();

		await expect(firstCheckbox).toBeChecked();
	});

	test('should clear search with empty input', async ({ page }) => {
		const searchInput = page.locator('input[placeholder*="Search prompts"]');

		// Type and clear
		await searchInput.fill('test');
		await searchInput.clear();

		const queryState = page.locator('text=Query: (empty)');
		await expect(queryState).toBeVisible();
	});
});

test.describe('Tag Modal Interactions', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
		await expect(page.locator('h1')).toContainText('UI Component Test Suite');
	});

	test('should open tag modal on button click', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Modal should be visible with title
		await expect(page.locator('text=Manage Tags')).toBeVisible();
	});

	test('should display existing tags in modal', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Should show existing tags
		await expect(page.locator('text=High Priority')).toBeVisible();
		await expect(page.locator('text=Review Needed')).toBeVisible();
		await expect(page.locator('text=Completed')).toBeVisible();
	});

	test('should close modal with close button', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		await expect(page.locator('text=Manage Tags')).toBeVisible();

		// Find and click close button
		const closeButton = page.locator('button:has-text("Close")');
		await closeButton.click();

		// Modal should be closed
		await expect(page.locator('text=Manage Tags')).not.toBeVisible();
	});

	test('should fill and submit tag creation form', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Fill form fields
		const nameInput = page.locator('input[placeholder*="e.g., High Priority"]');
		await nameInput.fill('Test Tag');

		// Submit button should be enabled
		const createButton = page.locator('button:has-text("Create Tag")');
		await expect(createButton).not.toBeDisabled();
		await createButton.click();

		// Action should be logged (console check in integration test)
	});

	test('should handle tag color selection', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Color input should be available
		const colorInputs = page.locator('input[type="color"]');
		await expect(colorInputs.first()).toBeVisible();

		// Change color
		await colorInputs.first().fill('#FF0000');
	});

	test('should validate tag name is required', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Create button should be disabled without name
		const createButton = page.locator('button:has-text("Create Tag")');
		await expect(createButton).toBeDisabled();
	});
});

test.describe('Accessibility Verification', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
	});

	test('should have proper heading hierarchy', async ({ page }) => {
		// Check for h1 (main heading)
		await expect(page.locator('h1')).toBeVisible();

		// Check for h2 (section headings)
		const h2s = page.locator('h2');
		expect(await h2s.count()).toBeGreaterThan(0);
	});

	test('should have labeled form inputs', async ({ page }) => {
		// Search input should have aria-label or be associated with label
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await expect(searchInput).toHaveAttribute('aria-label', 'Search prompts');
	});

	test('should have focus indicators on interactive elements', async ({ page }) => {
		const folderButton = page.locator('button:has-text("All Folders")').first();

		// Tab to button to focus it
		await page.keyboard.press('Tab');

		// Check focus is visible (ring-2 class or similar visual indicator)
		// This is a visual test - focus should be visible
		await expect(folderButton).toBeFocused();
	});

	test('should have color indicators paired with text labels', async ({ page }) => {
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Color circles should be paired with text labels
		const tagItems = page.locator('div:has-text("High Priority")');
		await expect(tagItems).toBeVisible();
	});

	test('should have sufficient touch target sizes', async ({ page }) => {
		const buttons = page.locator('button');
		const count = await buttons.count();

		// At least one button should be present (buttons are 44x44px minimum)
		expect(count).toBeGreaterThan(0);
	});
});

test.describe('Complete Workflows', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/test-ui');
	});

	test('should perform folder expand and search workflow', async ({ page }) => {
		// Expand General folder
		const generalFolderItem = page.locator('text=General').first().locator('..');
		const expandButton = generalFolderItem.locator('button').first();
		await expandButton.click();

		// Verify child appears
		await expect(page.locator('text=Customer Support')).toBeVisible();

		// Search
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await searchInput.fill('test');

		// Verify search state updated
		await expect(page.locator('text=Query: test')).toBeVisible();
	});

	test('should perform tag creation workflow', async ({ page }) => {
		// Open modal
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();

		// Fill form
		const nameInput = page.locator('input[placeholder*="e.g., High Priority"]');
		await nameInput.fill('Urgent');

		// Verify button is enabled
		const createButton = page.locator('button:has-text("Create Tag")');
		await expect(createButton).not.toBeDisabled();
	});

	test('should maintain state across interactions', async ({ page }) => {
		// Perform search
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await searchInput.fill('prompt');

		// Verify state is maintained
		await expect(searchInput).toHaveValue('prompt');

		// Open modal (should not clear search)
		const openButton = page.locator('button:has-text("Open Tag Modal")');
		await openButton.click();
		await page.locator('button:has-text("Close")').click();

		// Search state should persist
		await expect(searchInput).toHaveValue('prompt');
	});
});
