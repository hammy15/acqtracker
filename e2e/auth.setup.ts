import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate as test user", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Fill in credentials
  await page.getByPlaceholder("admin@acquisitionchecklist.com").fill("sarah@acqchecklist.com");
  await page.getByPlaceholder("Enter your password").fill("password123");

  // Submit the form
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("/", { timeout: 15_000 });

  // Verify we landed on the dashboard
  await expect(page.getByText("acquisition overview")).toBeVisible();

  // Save signed-in state for other tests
  await page.context().storageState({ path: authFile });
});
