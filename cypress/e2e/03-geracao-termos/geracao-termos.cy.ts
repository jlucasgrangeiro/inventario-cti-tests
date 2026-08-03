import { atribuicoesListPage } from "../../pages/AtribuicoesListPage";
import { gerarTermoModal } from "../../pages/GerarTermoModal";
import { observacaoDeTeste } from "../../support/testData";
import { criarAtribuicaoDeTeste } from "../../support/setup";

// window.open não dá pra seguir no Cypress, então os testes de conteúdo batem
// direto na URL do PDF via cy.request e extraem o texto com cy.task("readPdfText")
describe("US03 - Geração de Termos", () => {
  let bondId: string;
  let bondId2: string;

  before(() => {
    cy.login();
    criarAtribuicaoDeTeste(observacaoDeTeste("vínculo de apoio para geração de termos")).then((id) => {
      bondId = id;
    });
    criarAtribuicaoDeTeste(observacaoDeTeste("segundo vínculo para geração de termos múltiplos")).then((id) => {
      bondId2 = id;
    });
  });

  beforeEach(() => {
    cy.login();
    atribuicoesListPage.visit();
    atribuicoesListPage.selectRowCheckbox(bondId);
    atribuicoesListPage.clickGerarTermos();
    gerarTermoModal.modalDeveEstarVisivel();
  });

  context("Casos positivos", () => {
    it("deve permitir selecionar apenas um tipo de termo por vez (mutuamente exclusivo)", () => {
      gerarTermoModal.selecionarTipo("Responsabilidade");
      gerarTermoModal.tipoDeveEstarMarcado("Responsabilidade");
      gerarTermoModal.selecionarTipo("Empréstimo");
      gerarTermoModal.tipoDeveEstarMarcado("Empréstimo");
      gerarTermoModal.tipoDeveEstarDesmarcado("Responsabilidade");
    });

    // app usa data-dismiss (Bootstrap 4) mas carrega Bootstrap 5, que exige data-bs-* — X e Esc não fecham
    it("[BUG] o ícone X (e a tecla Esc) não fecham o modal — data-dismiss sem prefixo bs- é ignorado pelo Bootstrap 5", () => {
      gerarTermoModal.fechar();
      gerarTermoModal.modalDeveEstarVisivel();
      cy.screenshot("BUG-02-modal-nao-fecha-no-x", { capture: "fullPage" });
    });

    it("deve gerar PDF de Termo de Responsabilidade com todo o conteúdo obrigatório", () => {
      cy.request({
        url: `/portal_service/bonds/term_responsibility_asset?bonds_ids=${bondId}&term_type=liability`,
        encoding: "binary",
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.headers["content-type"]).to.include("pdf");
        cy.writeFile("cypress/downloads/termo-responsabilidade.pdf", response.body, "binary");
      });
      cy.task("readPdfText", "cypress/downloads/termo-responsabilidade.pdf").then((texto) => {
        const t = texto as string;
        expect(t).to.match(/TERMO DE RESPONSABILIDADE/i);
        expect(t).to.match(/Nome:/i);
        expect(t).to.match(/CPF/i);
        expect(t).to.match(/Área/i);
        expect(t).to.match(/ATIVOS ATRIBU[IÍ]DOS/i);
        expect(t).to.match(/Fortaleza,/i);
        expect(t).to.match(/Assinatura/i);
        expect(t, "nome do colaborador e área do vínculo devem constar no termo").to.include("Teste");
      });
    });

    it("deve gerar termo único para múltiplas atribuições selecionadas, abrindo o PDF em nova aba (window.open)", () => {
      atribuicoesListPage.visit();
      atribuicoesListPage.selectRowCheckbox(bondId);
      atribuicoesListPage.selectRowCheckbox(bondId2);
      atribuicoesListPage.clickGerarTermos();
      gerarTermoModal.modalDeveEstarVisivel();
      gerarTermoModal.selecionarTipo("Responsabilidade");

      cy.window().then((win) => cy.stub(win, "open").as("windowOpen"));
      gerarTermoModal.clickGerar();

      cy.get("@windowOpen").should("have.been.calledOnce");
      cy.get("@windowOpen").then((stub) => {
        const url = (stub as unknown as sinon.SinonStub).firstCall.args[0] as string;
        expect(url, "URL do PDF deve conter ambos os vínculos selecionados").to.include(bondId);
        expect(url).to.include(bondId2);
        expect(url).to.include("term_type=liability");
      });
    });

    it("deve gerar PDF de Termo de Empréstimo com todo o conteúdo obrigatório", () => {
      cy.request({
        url: `/portal_service/bonds/term_responsibility_asset?bonds_ids=${bondId}&term_type=loan`,
        encoding: "binary",
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.headers["content-type"]).to.include("pdf");
        cy.writeFile("cypress/downloads/termo-emprestimo.pdf", response.body, "binary");
      });
      cy.task("readPdfText", "cypress/downloads/termo-emprestimo.pdf").then((texto) => {
        const t = texto as string;
        expect(t).to.match(/TERMO DE EMPR[ÉE]STIMO/i);
        expect(t).to.match(/Nome:/i);
        expect(t).to.match(/ATIVOS ATRIBU[IÍ]DOS/i);
        expect(t).to.match(/Fortaleza,/i);
        expect(t).to.match(/Assinatura/i);
      });
    });
  });

  context("Casos negativos", () => {
    it("não deve permitir gerar termo sem selecionar um tipo", () => {
      cy.window().then((win) => cy.stub(win, "alert").as("alert"));
      gerarTermoModal.clickGerar();
      cy.get("@alert").should("have.been.calledWithMatch", /selecione um tipo/i);
    });

    // listagem não desabilita "Gerar Termos" sem seleção — acaba gerando PDF com bonds_ids vazio
    it("[ACHADO] permite abrir o modal e gerar termo sem nenhuma atribuição selecionada (bonds_ids vazio)", () => {
      atribuicoesListPage.visit();
      atribuicoesListPage.clickGerarTermos();
      gerarTermoModal.modalDeveEstarVisivel();
      gerarTermoModal.selecionarTipo("Responsabilidade");
      cy.screenshot("BUG-22-gerar-termo-sem-atribuicao-selecionada", { capture: "fullPage" });

      cy.window().then((win) => {
        cy.stub(win, "open").as("windowOpen");
        cy.stub(win, "alert").as("alert");
      });
      gerarTermoModal.clickGerar();

      cy.then(function () {
        const open = this.windowOpen as sinon.SinonStub;
        const alert = this.alert as sinon.SinonStub;
        expect(open.called || alert.called, "a aplicação deve reagir ao clique em Gerar").to.eq(true);
        if (open.called) {
          const url = open.firstCall.args[0] as string;
          expect(url, "gera termo com bonds_ids vazio").to.match(/bonds_ids=(&|$)/);
        }
      });
    });
  });
});
