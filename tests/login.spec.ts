import { test, expect, Page, Locator } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email-input");
    this.passwordInput = page.locator("#password-input");
    this.loginButton = page.locator("#login-button");
    this.successMessage = page.locator("div.message.success");
    this.errorMessage = page.locator("div.message.error");
    this.validationErrors = page.locator("div.validation.error");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithEnter(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.passwordInput.press("Enter");
  }

  async submitEmptyForm() {
    await this.loginButton.click();
  }
}

test.describe("Login", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    const filePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../htmls/login-page.html",
    );
    await loginPage.page.goto(`file://${filePath}`);
  });

  class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly successMessage: Locator;
    readonly errorMessage: Locator;
    readonly validationErrors: Locator;

    constructor(page: Page) {
      this.page = page;
      this.emailInput = page.locator("#email-input");
      this.passwordInput = page.locator("#password-input");
      this.loginButton = page.locator("#login-button");
      this.successMessage = page.locator("div.message.success");
      this.errorMessage = page.locator("div.message.error");
      this.validationErrors = page.locator("div.validation.error");
    }

    async login(email: string, password: string) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    }

    async loginWithEnter(email: string, password: string) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.passwordInput.press("Enter");
    }

    async submitEmptyForm() {
      await this.loginButton.click();
    }
  }

  test("TC1: Login form fields are visible", async ({ page }) => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test("TC2: Login is successfull with valid credentials", async ({ page }) => {
    await loginPage.login("login@codility.com", "password");

    await expect(loginPage.successMessage).toBeVisible();
    await expect(loginPage.successMessage).toContainText("Welcome to Codility");
  });

  test("TC3: Invalid credentials displays error message", async ({ page }) => {
    await loginPage.login("unknown@codility.com", "password");

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(
      "You shall not pass! Arr!",
    );
  });

  test("TC4: Invalid email displays validation error message", async ({
    page,
  }) => {
    await loginPage.login("invalid-email", "password");

    await expect(loginPage.validationErrors).toContainText(
      "Enter a valid email",
    );
  });

  test("TC5: Empty credentials displays validation errors", async ({
    page,
  }) => {
    await loginPage.submitEmptyForm();

    await expect(loginPage.validationErrors).toHaveCount(2);
    await expect(loginPage.validationErrors.first()).toContainText(
      "Email is required",
    );
    await expect(loginPage.validationErrors.nth(1)).toContainText(
      "Password is required",
    );
  });

  test("TC6: TAB navigation and ENTER submission work", async ({ page }) => {
    await loginPage.emailInput.focus();
    await expect(loginPage.emailInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(loginPage.passwordInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(loginPage.loginButton).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(loginPage.validationErrors).toHaveCount(2);

    await loginPage.loginWithEnter("login@codility.com", "password");

    // bug: enter does not submit
    await expect(loginPage.successMessage).toContainText("Welcome to Codility");
  });
});
