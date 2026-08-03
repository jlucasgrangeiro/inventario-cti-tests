export class AtribuicoesListPage {
  visit(): void {
    cy.visit("/portal_service/bonds");
  }

  clickNovaAtribuicao(): void {
    cy.contains("a", "Nova Atribuição").click();
  }

  selectRowCheckbox(bondId: string): void {
    cy.get(`input.marcar[value='${bondId}']`).check({ force: true });
  }

  clickGerarTermos(): void {
    cy.contains("button", "Gerar Termos").click();
  }

  primeiroBondIdDaListagem(): Cypress.Chainable<string> {
    return cy.get("input.marcar").first().invoke("val") as Cypress.Chainable<string>;
  }
}

export const atribuicoesListPage = new AtribuicoesListPage();
