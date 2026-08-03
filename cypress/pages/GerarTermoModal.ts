export type TipoTermo = "Responsabilidade" | "Empréstimo";

// clique em Gerar faz window.open() do PDF; testes de conteúdo usam cy.request contra a URL direta
export class GerarTermoModal {
  private radioId(tipo: TipoTermo): string {
    return tipo === "Responsabilidade" ? "#term_type_liability" : "#term_type_loan";
  }

  selecionarTipo(tipo: TipoTermo): void {
    cy.get(this.radioId(tipo)).check({ force: true });
  }

  tipoDeveEstarMarcado(tipo: TipoTermo): void {
    cy.get(this.radioId(tipo)).should("be.checked");
  }

  tipoDeveEstarDesmarcado(tipo: TipoTermo): void {
    cy.get(this.radioId(tipo)).should("not.be.checked");
  }

  clickGerar(): void {
    cy.get("#btn-termo").click();
  }

  fechar(): void {
    cy.get("#generate_term").find("[data-dismiss=modal]").click();
  }

  modalDeveEstarVisivel(): void {
    cy.get("#generate_term").should("be.visible");
  }

  modalDeveEstarFechado(): void {
    cy.get("#generate_term").should("not.be.visible");
  }
}

export const gerarTermoModal = new GerarTermoModal();
