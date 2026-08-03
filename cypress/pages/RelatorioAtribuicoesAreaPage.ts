export type TipoRelatorio = "Sintético" | "Analítico";

export interface FiltroAtribuicoesArea {
  tipo?: TipoRelatorio;
  area?: string;
  subarea?: string;
}

// a tela real é um painel de conformidade por área (Sintético/Analítico), não o relatório
// de movimentação que o desafio descreve — ver docs/plano-de-teste.md
export class RelatorioAtribuicoesAreaPage {
  visit(): void {
    cy.visit("/portal_service/reports/assignments_by_area");
  }

  aplicarFiltro(filtro: FiltroAtribuicoesArea): void {
    if (filtro.tipo) {
      const id = filtro.tipo === "Sintético" ? "#type_syntetic" : "#type_analytic";
      cy.get(id).check({ force: true });
    }
    if (filtro.area) {
      cy.get("#search_area").select(filtro.area, { force: true });
    }
    if (filtro.subarea) {
      cy.get("#search_subarea").select(filtro.subarea, { force: true });
    }
    cy.get("input[type=submit][value=Pesquisar]").click();
  }

  hrefGerarRelatorio(): Cypress.Chainable<string> {
    return cy.contains("a", "Gerar Relatório").invoke("attr", "href") as Cypress.Chainable<string>;
  }

  deveExibirTotalDeAtribuicoes(): void {
    cy.contains(/total de atribuiç(ões|oes)/i).should("be.visible");
  }

  deveExibirListagemAnalitica(): void {
    cy.contains(/relat[óo]rio anal[íi]tico/i).should("be.visible");
    cy.contains(/colaborador\(a\)/i).should("be.visible");
  }
}

export const relatorioAtribuicoesAreaPage = new RelatorioAtribuicoesAreaPage();
