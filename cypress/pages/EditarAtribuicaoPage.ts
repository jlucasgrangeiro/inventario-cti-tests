import { NovaAtribuicaoPage } from "./NovaAtribuicaoPage";

export type StatusAtivo = "DISPONÍVEL" | "COM DEFEITO" | "VÍNCULADO" | "VÍNCULADO EM USO";

export class EditarAtribuicaoPage extends NovaAtribuicaoPage {
  visit(bondId: string): void {
    cy.visit(`/portal_service/bonds/${bondId}/edit`);
  }

  ativoRow(tombo: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(".add_ativo", tombo);
  }

  removerAtivo(tombo: string): void {
    this.ativoRow(tombo).find("a.remove_fields").click({ force: true });
  }

  marcarStatusAtivo(tombo: string, status: StatusAtivo): void {
    this.ativoRow(tombo)
      .find("select#set_status")
      .then(($select) => {
        const opt = $select.find("option").filter((_, o) => (o as HTMLOptionElement).text.trim() === status);
        cy.wrap($select).select(opt.val() as string, { force: true });
      });
  }

  informarDefeito(tombo: string, descricaoDefeito: string): void {
    this.ativoRow(tombo).find("input[type=text]").type(descricaoDefeito);
  }

  primeiroTomboDaAtribuicao(): Cypress.Chainable<string> {
    return cy
      .get("#bond_asset .add_ativo")
      .first()
      .find("select#set_tombo option:selected")
      .invoke("text")
      .then((t) => (t as unknown as string).trim());
  }

  quantidadeDeAtivos(): Cypress.Chainable<number> {
    return cy.get("#bond_asset .add_ativo").its("length");
  }
}

export const editarAtribuicaoPage = new EditarAtribuicaoPage();
