import { defineConfig, devices } from "@playwright/test";
import process from "process";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 5,
  reporter: "html",
  use: {
    // baseURL: 'http://localhost:3000',
    // trace: "on-first-retry",
  },

  // projects: [
  //   {
  //     name: "chromium",
  //     use: { ...devices["Desktop Chrome"] },
  //   },
  // ],
});
