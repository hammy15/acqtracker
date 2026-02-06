import { test, expect } from "@playwright/test";

// These tests run WITHOUT storageState (unauthenticated)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login flow", () => {
  test("should display the login form", async ({ page }) => {
    await page.goto("/login");

    // Verify the heading and form elements are visible
    await expect(page.getByRole("heading", { name: "Acquisition Checklist" })).toBeVisible();
    await expect(page.getByPlaceholder("admin@acquisitionchecklist.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("admin@acquisitionchecklist.com").fill("bad@example.com");
    await page.getByPlaceholder("Enter your password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for the error message
    await expect(page.getByText("Invalid email or password")).toBeVisible({ timeout: 10_000 });
  });

  test("should login successfully and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("admin@acquisitionchecklist.com").fill("sarah@acqchecklist.com");
    await page.getByPlaceholder("Enter your password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to the dashboard
    await page.waitForURL("/", { timeout: 15_000 });

    // Verify dashboard content is visible
    await expect(page.getByText("acquisition overview")).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByPlaceholder("Enter your password");

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the toggle button (the eye icon button)
    await page.locator("button").filter({ has: page.locator("svg") }).last().click();

    // Now password should be visible
    await expect(passwordInput).toHaveAttribute("type", "text");
  });
});
