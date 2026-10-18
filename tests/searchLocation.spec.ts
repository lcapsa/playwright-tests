import { test, expect, Page, Locator } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The task requires five checks:
// 1. The search input and submit button are visible.
// 2. Submitting an empty query displays #error-empty-query.
// 3. Searching for isla returns at least one result.
// 4. Searching for castle displays #error-no-results.
// 5. Searching for port returns exactly one result: Port Royal.

class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resultsList: Locator;
  readonly emptyQueryError: Locator;
  readonly noResultsError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator("#search-input");
    this.searchButton = page.locator("#search-button");
    this.resultsList = page.locator("#search-results li");
    this.emptyQueryError = page.locator("#error-empty-query");
    this.noResultsError = page.locator("#error-no-results");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async getResultTexts(): Promise<string[]> {
    return this.resultsList.allTextContents();
  }
}

test.describe("Locations search", () => {
  let searchPage: SearchPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new SearchPage(page);
    const filePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../htmls/search_locations_page.html",
    );
    await searchPage.page.goto(`file://${filePath}`);
  });

  test("TC1: Search input and submit button are displayed on main page", async () => {
    await expect(searchPage.searchInput).toBeVisible();
    await expect(searchPage.searchButton).toBeVisible();
  });

  test("TC2: Error is returned when searching with empty query", async () => {
    await searchPage.search("");

    await expect(searchPage.emptyQueryError).toBeVisible();
    await expect(searchPage.emptyQueryError).toHaveText("Provide some query");
  });

  test("TC3: At least one island is returned after querying for isla", async () => {
    await searchPage.search("isla");

    await expect(searchPage.resultsList.first()).toBeVisible();
    expect(await searchPage.resultsList.count()).toBeGreaterThan(0);

    for (let location of await searchPage.resultsList.allInnerTexts()) {
      expect(location.toLowerCase()).toContain("isla");
    }
  });

  test("TC4: Error message displayed when no locations match", async () => {
    await searchPage.search("castle");

    await expect(searchPage.resultsList).toHaveCount(0);
    await expect(searchPage.noResultsError).toBeVisible();
    await expect(searchPage.noResultsError).toHaveText("No results");
  });

  test("TC5: Search results match the query", async () => {
    await searchPage.search("port");

    await expect(searchPage.resultsList).toHaveCount(1);
    await expect(searchPage.resultsList).toHaveText("Port Royal");

    // should perform a case-insensitive search
    await searchPage.search("PORT");

    await expect(searchPage.resultsList).toHaveCount(1);
    await expect(searchPage.resultsList).toHaveText("Port Royal");
  });
});
