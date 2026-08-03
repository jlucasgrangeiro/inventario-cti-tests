export interface ColaboradorFormData {
  nome: string;
  email?: string;
}

// modelo User no backend, aparece como "Colaboradores" na UI (não confundir com Admin)
export class ColaboradoresPage {
  visitLista(): void {
    cy.visit("/portal_service/users");
  }

  visitNovo(): void {
    cy.visit("/portal_service/users/new");
  }

  preencher(dados: ColaboradorFormData): void {
    cy.get("#user_name").clear().type(dados.nome, { parseSpecialCharSequences: false });
    if (dados.email !== undefined) {
      cy.get("#user_email").clear();
      if (dados.email) cy.get("#user_email").type(dados.email);
    }
  }

  submit(): void {
    cy.get("input[type=submit][name=commit]").click();
  }

  cadastrar(dados: ColaboradorFormData): void {
    this.visitNovo();
    this.preencher(dados);
    this.submit();
  }

  linhaComNome(nome: string): Cypress.Chainable<JQuery<HTMLTableRowElement>> {
    return cy.contains("tr", nome);
  }
}

export const colaboradoresPage = new ColaboradoresPage();
