export interface FiltroMovimentacao {
  area?: string;
  dataInicio?: string;
  dataFim?: string;
}

// Pesquisar reenvia o form (não é AJAX); Gerar Relatório é <a> pra PDF inline
export class RelatorioMovimentacaoPage {
  visit(): void {
    cy.visit("/portal_service/reports/index");
  }

  aplicarFiltro(filtro: FiltroMovimentacao): void {
    if (filtro.area) {
      // select2 esconde o <select> nativo; força a seleção no elemento original
      cy.get("#area_name").select(filtro.area, { force: true });
    }
    if (filtro.dataInicio) {
      cy.get("#initial_date").type(filtro.dataInicio);
    }
    if (filtro.dataFim) {
      cy.get("#final_date").type(filtro.dataFim);
    }
    cy.get("input[type=submit][value=Pesquisar]").click();
  }

  // lê o href real (em vez de reconstruir a URL) — valida o que a app renderizou
  hrefGerarRelatorio(): Cypress.Chainable<string> {
    return cy.contains("a", "Gerar Relatório").invoke("attr", "href") as Cypress.Chainable<string>;
  }

  grupoDeArea(nomeArea: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains("td.text-success, td", nomeArea);
  }

  deveExibirCabecalhoDeData(textoParcial: string): void {
    cy.contains(new RegExp(textoParcial + ".*movimenta", "i")).should("be.visible");
  }

  // critério US04: data por extenso, ex. "21 de Janeiro de 2026 - 2 movimentações"
  deveExibirDataNoFormatoBrasileiro(): void {
    cy.contains(/\d{1,2} de [a-zçãé]+ de \d{4}\s*-\s*\d+ movimenta/i).should("be.visible");
  }

  linkGerarRelatorio(): Cypress.Chainable<JQuery<HTMLAnchorElement>> {
    return cy.contains("a", "Gerar Relatório");
  }

  deveExibirColunas(): void {
    ["Tombo", "Nº de Série", "Descrição", "Lotação Anterior", "Lotação Atual", "Colaborador"].forEach((coluna) => {
      cy.contains("th", coluna).should("be.visible");
    });
  }

  deveExibirMensagemSemDados(): void {
    cy.contains(/sem movimenta[çc][õo]es|nenhum.*(dado|movimenta)|não há dados|sem resultados/i).should(
      "be.visible"
    );
  }
}

export const relatorioMovimentacaoPage = new RelatorioMovimentacaoPage();
