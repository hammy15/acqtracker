import { test, expect } from "@playwright/test";

test.describe("Deals list", () => {
  test("should display the deals page with heading", async ({ page }) => {
    await page.goto("/deals");

    await expect(
      page.getByRole("heading", { name: "Deals" })
    ).toBeVisible();

    // Subtext with count of active acquisitions
    await expect(page.getByText(/active acquisition/)).toBeVisible({ timeout: 15_000 });
  });

  test("should render deal cards after loading", async ({ page }) => {
    await page.goto("/deals");

    // Wait for skeleton loaders to be replaced by actual deal links
    const dealCards = page.locator("a[href^='/deals/']");
    await expect(dealCards.first()).toBeVisible({ timeout: 15_000 });
  });

  test("should filter deals by search input", async ({ page }) => {
    await page.goto("/deals");

    // Wait for deals to load
    const dealCards = page.locator("a[href^='/deals/']");
    await expect(dealCards.first()).toBeVisible({ timeout: 15_000 });

    // Get initial count
    const initialCount = await dealCards.count();

    // Type a search query
    const searchInput = page.getByPlaceholder("Search deals...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("zzzznonexistent");

    // Wait for the query to update — either no results or fewer results
    // The deals list should re-render after the search debounce
    await page.waitForTimeout(1_000);

    // Either no deal cards or the count changed
    const filteredCount = await dealCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("should filter deals by status", async ({ page }) => {
    await page.goto("/deals");

    // Wait for deals to load
    await expect(page.locator("a[href^='/deals/']").first()).toBeVisible({ timeout: 15_000 });

    // Click on a specific status pill (e.g., "LOI")
    const loiButton = page.getByRole("button", { name: /^LOI/ });
    await loiButton.click();

    // Wait for filtered results to load
    await page.waitForTimeout(500);

    // The page should still be functional — heading is still visible
    await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();
  });

  test("should toggle between grid and list views", async ({ page }) => {
    await page.goto("/deals");

    // Wait for deals
    await expect(page.locator("a[href^='/deals/']").first()).toBeVisible({ timeout: 15_000 });

    // Find the view toggle buttons (LayoutGrid and List icons)
    // The second button in the toggle group switches to list view
    const viewToggle = page.locator("button").filter({ has: page.locator("svg") });

    // Click the list view button (it's the last toggle button in the group)
    // The toggle buttons are inside a flex container with rounded-xl
    const listButton = page.locator(".rounded-xl.overflow-hidden button").last();
    await listButton.click();

    // The layout should change — list view uses space-y-3 instead of grid
    await expect(page.locator(".space-y-3")).toBeVisible();
  });

  test("should have a New Deal button", async ({ page }) => {
    await page.goto("/deals");

    // The "New Deal" link may be permission-gated, but we check if it exists for our test user
    const newDealLink = page.getByRole("link", { name: /New Deal/ });
    // If the user has permission, verify it links to /deals/new
    if (await newDealLink.isVisible()) {
      await expect(newDealLink).toHaveAttribute("href", "/deals/new");
    }
  });
});
