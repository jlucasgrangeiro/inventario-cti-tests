import fs from "fs";
import pdfParse from "pdf-parse";

// PDF parsing roda em Node via cy.task, já que o Cypress roda no browser
export function registerPdfTasks(on: Cypress.PluginEvents): void {
  on("task", {
    async readPdfText(filePath: string): Promise<string> {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    },
  });
}
