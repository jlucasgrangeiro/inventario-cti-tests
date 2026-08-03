import { relatorioMovimentacaoPage } from "../../pages/RelatorioMovimentacaoPage";

describe("US04 - Relatório de Movimentação de Ativos", () => {
  beforeEach(() => {
    cy.login();
    relatorioMovimentacaoPage.visit();
  });

  context("Casos positivos", () => {
    it("deve filtrar movimentações por Área e Período e atualizar a listagem ao Pesquisar", () => {
      relatorioMovimentacaoPage.aplicarFiltro({
        area: "CTI",
        dataInicio: "2020-01-01",
        dataFim: "2026-12-31",
      });
      relatorioMovimentacaoPage.grupoDeArea("CTI").should("be.visible");
    });

    it("deve agrupar resultados por área, exibindo o nome da área como cabeçalho, com data e quantidade de movimentações", () => {
      relatorioMovimentacaoPage.aplicarFiltro({ area: "CTI", dataInicio: "2020-01-01", dataFim: "2026-12-31" });
      relatorioMovimentacaoPage.grupoDeArea("CTI").should("exist");
      relatorioMovimentacaoPage.deveExibirCabecalhoDeData("de");
      relatorioMovimentacaoPage.deveExibirDataNoFormatoBrasileiro();
    });

    it("deve permitir filtrar apenas por Área (sem período)", () => {
      relatorioMovimentacaoPage.aplicarFiltro({ area: "CTI" });
      relatorioMovimentacaoPage.grupoDeArea("CTI").should("exist");
    });

    it("deve permitir filtrar apenas por Período (sem área), listando movimentações de todas as áreas", () => {
      relatorioMovimentacaoPage.aplicarFiltro({ dataInicio: "2020-01-01", dataFim: "2026-12-31" });
      relatorioMovimentacaoPage.deveExibirColunas();
    });

    it("deve exibir Tombo, Nº de Série, Descrição, Lotação Anterior/Atual e Colaborador para cada ativo", () => {
      relatorioMovimentacaoPage.aplicarFiltro({ area: "CTI", dataInicio: "2020-01-01", dataFim: "2026-12-31" });
      relatorioMovimentacaoPage.deveExibirColunas();
    });

    it("deve gerar PDF do relatório respeitando o agrupamento por área e data", () => {
      relatorioMovimentacaoPage.aplicarFiltro({ area: "CTI", dataInicio: "2020-01-01", dataFim: "2026-12-31" });

      relatorioMovimentacaoPage.hrefGerarRelatorio().then((href) => {
        expect(href).to.include("pdf_create");
        cy.request({ url: href, encoding: "binary" }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.headers["content-type"]).to.include("pdf");
          cy.writeFile("cypress/downloads/movimentacao-ativos.pdf", response.body, "binary");
        });
      });
      cy.task("readPdfText", "cypress/downloads/movimentacao-ativos.pdf").then((texto) => {
        const t = texto as string;
        expect(t).to.match(/CTI/);
        expect(t).to.match(/Tombo/);
        expect(t).to.match(/Colaborador/);
        expect(t).to.match(/movimenta[çc][õo]es/i);
      });
    });
  });

  context("Achados de defeito", () => {
    // critério pede nova aba, mas o link não tem target=_blank
    it("[BUG] 'Gerar Relatório' abre o PDF na mesma aba (link sem target=_blank), contrariando o critério", () => {
      relatorioMovimentacaoPage.aplicarFiltro({ area: "CTI", dataInicio: "2020-01-01", dataFim: "2026-12-31" });
      relatorioMovimentacaoPage.linkGerarRelatorio().should("not.have.attr", "target", "_blank");
      cy.screenshot("BUG-07-gerar-relatorio-sem-target-blank", { capture: "fullPage" });
    });
  });

  context("Casos negativos", () => {
    it("deve informar que não há dados disponíveis quando não existem movimentações no período/área", () => {
      relatorioMovimentacaoPage.aplicarFiltro({
        area: "Teste",
        dataInicio: "2000-01-01",
        dataFim: "2000-01-02",
      });
      relatorioMovimentacaoPage.deveExibirMensagemSemDados();
    });

    it("não deve retornar resultados quando a data final é anterior à data inicial (período invertido)", () => {
      relatorioMovimentacaoPage.aplicarFiltro({
        area: "CTI",
        dataInicio: "2026-12-31",
        dataFim: "2020-01-01",
      });
      // app não valida intervalo, apenas retorna listagem vazia
      relatorioMovimentacaoPage.deveExibirMensagemSemDados();
      cy.screenshot("BUG-23-periodo-invertido-nao-validado", { capture: "fullPage" });
    });
  });
});
