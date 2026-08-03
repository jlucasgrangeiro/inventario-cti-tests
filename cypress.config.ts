import { defineConfig } from "cypress";
import { registerPdfTasks } from "./cypress/tasks/pdf.tasks";

export default defineConfig({
  e2e: {
    baseUrl: "http://testeqa.pge.ce.gov.br",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",
    downloadsFolder: "cypress/downloads",
    video: true,
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    viewportWidth: 1366,
    viewportHeight: 768,
    chromeWebSecurity: false,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    env: {},
    reporter: "cypress-multi-reporters",
    reporterOptions: {
      configFile: "reporter-config.json",
    },
    setupNodeEvents(on, config) {
      registerPdfTasks(on);
      return config;
    },
  },
});
