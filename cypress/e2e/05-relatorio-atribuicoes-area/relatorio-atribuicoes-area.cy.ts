import { relatorioAtribuicoesAreaPage } from "../../pages/RelatorioAtribuicoesAreaPage";

// desafio descreve o mesmo relatório da US04, mas a tela real é um painel de conformidade
// por área (Sintético/Analítico), sem filtro de período — ver docs/plano-de-teste.md
describe("US05 - Relatório de Atribuições por Área", () => {
  beforeEach(() => {
    cy.login();
    relatorioAtribuicoesAreaPage.visit();
  });

  context("Casos positivos", () => {
    it("modo Sintético: deve filtrar por Área e exibir o total de atribuições e os indicadores da área", () => {
      relatorioAtribuicoesAreaPage.aplicarFiltro({ tipo: "Sintético", area: "CTI" });
      cy.contains(/relat[óo]rio sint[ée]tico/i).should("be.visible");
      relatorioAtribuicoesAreaPage.deveExibirTotalDeAtribuicoes();
    });

    it("modo Analítico: deve listar as atribuições da área agrupadas por colaborador", () => {
      relatorioAtribuicoesAreaPage.aplicarFiltro({ tipo: "Analítico", area: "CTI" });
      relatorioAtribuicoesAreaPage.deveExibirListagemAnalitica();
    });

    it("deve permitir filtrar também por Subárea", () => {
      relatorioAtribuicoesAreaPage.aplicarFiltro({ tipo: "Analítico", area: "CTI", subarea: "COORDENAÇÃO" });
      relatorioAtribuicoesAreaPage.deveExibirListagemAnalitica();
    });

    it("deve gerar PDF do relatório após pesquisar", () => {
      relatorioAtribuicoesAreaPage.aplicarFiltro({ tipo: "Analítico", area: "CTI" });

      relatorioAtribuicoesAreaPage.hrefGerarRelatorio().then((href) => {
        expect(href).to.include("assignments_by_area_pdf");
        cy.request({ url: href, encoding: "binary" }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.headers["content-type"]).to.include("pdf");
          cy.writeFile("cypress/downloads/atribuicoes-por-area.pdf", response.body, "binary");
        });
      });
      cy.task("readPdfText", "cypress/downloads/atribuicoes-por-area.pdf").then((texto) => {
        const t = texto as string;
        expect(t, "o PDF deve refletir a área filtrada").to.match(/CTI/);
        expect(t).to.match(/tombo|colaborador|atribui/i);
      });
    });
  });

  context("Casos negativos", () => {
    it("não deve permitir gerar relatório sem escolher Sintético ou Analítico (Tipo obrigatório)", () => {
      cy.get("#search_area").select("CTI", { force: true });
      cy.get("input[type=submit][value=Pesquisar]").click();
      cy.get("#type_syntetic").then(($el) => {
        expect(($el[0] as HTMLInputElement).validity.valid).to.eq(false);
      });
    });
  });
});
