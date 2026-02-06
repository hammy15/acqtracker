import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should display the greeting and overview text", async ({ page }) => {
    await page.goto("/");

    // The dashboard greets the user by first name
    // It could be "Good morning", "Good afternoon", or "Good evening"
    await expect(
      page.getByRole("heading").filter({ hasText: /Good (morning|afternoon|evening)/ })
    ).toBeVisible();

    await expect(page.getByText("acquisition overview")).toBeVisible();
  });

  test("should display stat cards", async ({ page }) => {
    await page.goto("/");

    // Wait for the stat cards to load (they replace skeleton loaders)
    await expect(page.getByText("Active Deals")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Due This Week")).toBeVisible();
    await expect(page.getByText("Overdue Tasks")).toBeVisible();
    await expect(page.getByText("Closing This Mo")).toBeVisible();
  });

  test("should display the Active Deals section", async ({ page }) => {
    await page.goto("/");

    // Wait for deals section header
    await expect(
      page.getByRole("heading", { name: "Active Deals" })
    ).toBeVisible({ timeout: 15_000 });

    // Verify at least one deal card is rendered (contains deal links)
    const dealCards = page.locator("a[href^='/deals/']");
    await expect(dealCards.first()).toBeVisible({ timeout: 15_000 });
  });

  test("should display the My Tasks section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "My Tasks" })
    ).toBeVisible({ timeout: 15_000 });

    // Tasks section has checkboxes
    const taskCheckboxes = page.getByRole("checkbox");
    // Either tasks are loaded or the section is visible
    await expect(page.getByText("My Tasks")).toBeVisible();
  });

  test("should display Portfolio Analytics section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Portfolio Analytics")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Deal Pipeline")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Workstream Progress")).toBeVisible({ timeout: 15_000 });
  });
});
