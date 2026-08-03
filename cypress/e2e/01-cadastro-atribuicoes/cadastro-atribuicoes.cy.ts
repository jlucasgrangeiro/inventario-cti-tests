import { atribuicoesListPage } from "../../pages/AtribuicoesListPage";
import { novaAtribuicaoPage } from "../../pages/NovaAtribuicaoPage";
import { observacaoDeTeste } from "../../support/testData";

describe("US01 - Cadastro de Atribuições", () => {
  beforeEach(() => {
    cy.login();
  });

  context("Casos positivos", () => {
    it("deve cadastrar atribuição com colaborador específico, ativo vinculado, SO e observações", () => {
      const marcador = observacaoDeTeste("cadastro válido com colaborador e ativo vinculado");

      atribuicoesListPage.visit();
      atribuicoesListPage.clickNovaAtribuicao();
      cy.location("pathname").should("eq", "/portal_service/bonds/new");

      cy.fixture("atribuicao-valida").then((dados) => {
        novaAtribuicaoPage.preencherFormulario({ ...dados, observacoes: marcador });
      });

      cy.obterTombosDisponiveis().then((tombos) => {
        novaAtribuicaoPage.salvarComPrimeiroAtivoAceito(tombos);
      });

      cy.location("pathname").should("eq", "/portal_service/bonds");
      cy.contains(/vinculados a:.*parabéns/i).should("be.visible");
      cy.contains("td", marcador).should("be.visible");
      cy.contains("tr", marcador).within(() => {
        cy.contains("td", "Teste");
        cy.contains("td", "Presencial");
      });
    });

    it("deve cadastrar atribuição em Home Office com Sistema Operacional e Pacote Office e persistir esses dados", () => {
      const marcador = observacaoDeTeste("cadastro Home Office + SO + Pacote Office");

      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.preencherFormulario({
        area: "Teste",
        subarea: "Teste",
        colaborador: "Teste",
        modalidade: "Home Office",
        sistemaOperacional: "WINDOWS 11 PRO",
        utilizaPacoteOffice: true,
        observacoes: marcador,
      });
      novaAtribuicaoPage.selecionarPacoteOffice();

      cy.obterTombosDisponiveis().then((tombos) => {
        novaAtribuicaoPage.salvarComPrimeiroAtivoAceito(tombos);
      });

      cy.location("pathname").should("eq", "/portal_service/bonds");
      cy.contains("tr", marcador).within(() => {
        cy.contains("td", "Home Office");
      });

      atribuicoesListPage.primeiroBondIdDaListagem().then((bondId) => {
        cy.visit(`/portal_service/bonds/${bondId}/edit`);
        cy.get("#bond_modality_home_office").should("be.checked");
        cy.get("#so").find("option:selected").should("have.text", "WINDOWS 11 PRO");
        cy.get("#check_office").should("be.checked");
        // combo Pacote Office pode estar vazio no QA, valida só a habilitação
        cy.get("#key").should("be.enabled");
      });
    });

    // combo Subárea não é filtrado pela Área, lista todas independente da escolha
    it("[ACHADO] o combo Subárea é populado ao selecionar a Área, mas NÃO é filtrado por ela (lista todas as subáreas)", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.selecionarArea("Teste");
      novaAtribuicaoPage.opcoesDeSubarea().should("include", "Teste");
      novaAtribuicaoPage.selecionarArea("CTI");
      novaAtribuicaoPage.opcoesDeSubarea().then((opcoes) => {
        expect(opcoes, "subáreas listadas após selecionar CTI").to.not.be.empty;
        expect(opcoes, "combo não filtra por área — 'Teste' segue listada sob CTI").to.include("Teste");
      });
      cy.screenshot("BUG-06-subarea-nao-filtrada-por-area", { capture: "fullPage" });
    });

    it("deve habilitar o campo Pacote Office somente quando a checkbox 'Utilizará Pacote Office?' estiver marcada", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.pacoteOfficeFieldDeveEstarDesabilitado();
      novaAtribuicaoPage.marcarUtilizaPacoteOffice();
      novaAtribuicaoPage.pacoteOfficeFieldDeveEstarHabilitado();
      novaAtribuicaoPage.desmarcarUtilizaPacoteOffice();
      novaAtribuicaoPage.pacoteOfficeFieldDeveEstarDesabilitado();
    });

    it("deve permitir adicionar mais de um ativo à mesma atribuição (múltiplos vínculos)", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.preencherFormulario({
        area: "Teste",
        subarea: "Teste",
        colaborador: "Teste",
        modalidade: "Presencial",
      });

      cy.obterTombosDisponiveis(2).then(([tombo1, tombo2]) => {
        novaAtribuicaoPage.atribuirAtivo(tombo1);
        novaAtribuicaoPage.ativosDaAtribuicao().find(".add_ativo").should("have.length", 1);
        novaAtribuicaoPage.atribuirAtivo(tombo2);
        novaAtribuicaoPage.ativosDaAtribuicao().find(".add_ativo").should("have.length", 2);
      });
    });

    it("deve descartar informações não salvas ao clicar em Cancelar", () => {
      const marcador = observacaoDeTeste("cancelamento sem salvar (não deve persistir)");

      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.preencherFormulario({
        area: "Teste",
        subarea: "Teste",
        colaborador: "Teste",
        modalidade: "Presencial",
        observacoes: marcador,
      });
      novaAtribuicaoPage.clickCancelar();

      cy.location("pathname").should("eq", "/portal_service/bonds");
      cy.contains("td", marcador).should("not.exist");
    });
  });

  context("Achados de defeito", () => {
    // rádio "Sem Colaborador"/"Subárea" só troca placeholder, #collaborators segue required e vazio
    it("[BUG] 'Sem Colaborador'/'Subárea' trocam o placeholder mas o campo Colaborador continua obrigatório e vazio, impedindo salvar", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.selecionarArea("Teste");
      novaAtribuicaoPage.selecionarSubarea("Teste");
      novaAtribuicaoPage.selecionarTipoColaborador("Subárea");

      cy.get("#collaborators").should("have.prop", "required", true);
      cy.get("#collaborators").invoke("val").should("be.oneOf", [null, ""]);
      novaAtribuicaoPage.selecionarModalidade("Presencial");
      cy.screenshot("BUG-01-colaborador-obrigatorio-e-vazio", { capture: "fullPage" });
      novaAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", "/portal_service/bonds/new");
      novaAtribuicaoPage.campoDeveEstarInvalido("#collaborators");
    });
  });

  context("Casos negativos", () => {
    it("não deve permitir salvar sem preencher nenhum campo obrigatório (validação nativa do formulário)", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", "/portal_service/bonds/new");
      novaAtribuicaoPage.campoDeveEstarInvalido("#set_area");
    });

    it("não deve permitir salvar sem selecionar Área", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.selecionarSubarea("Teste");
      novaAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", "/portal_service/bonds/new");
      novaAtribuicaoPage.campoDeveEstarInvalido("#set_area");
    });

    // BUG-04: validação da Subárea intermitente por race no AJAX que repopula o combo, ver docs/bugs-encontrados.md
    it("[BUG] validação da Subárea é intermitente (condição de corrida no AJAX) — monitor do comportamento observado", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.selecionarArea("Teste");
      novaAtribuicaoPage.selecionarColaborador("Teste");
      novaAtribuicaoPage.selecionarModalidade("Presencial");

      cy.get("#resp_subarea").then(($el) => {
        const select = $el[0] as HTMLSelectElement;
        const valor = select.value ?? "";
        const valido = select.checkValidity();
        cy.log(`Estado do #resp_subarea nesta execução: value="${valor}", checkValidity()=${valido}`);

        if (valor === "" && valido) {
          cy.log("DEFEITO reproduzido: campo obrigatório (*) vazio é considerado VÁLIDO — submit não será barrado");
        } else if (valor === "" && !valido) {
          cy.log("Nesta execução a validação atuou (vazio-inválido) — defeito intermitente não reproduzido");
        } else {
          cy.log(`DEFEITO (variante): AJAX auto-selecionou a subárea "${valor}" sem ação do usuário`);
        }

        expect(select.required, "select da Subárea deve ter o atributo required").to.eq(true);
      });
      cy.screenshot("BUG-04-subarea-validacao-intermitente", { capture: "fullPage" });
    });

    it("[BUG] permite salvar sem selecionar a Modalidade de trabalho (campo com * não é validado)", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.selecionarArea("Teste");
      novaAtribuicaoPage.selecionarSubarea("Teste");
      novaAtribuicaoPage.selecionarColaborador("Teste");
      cy.screenshot("BUG-05-modalidade-sem-required", { capture: "fullPage" });
      novaAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", "/portal_service/bonds");
    });

    it("não deve permitir salvar sem vincular ao menos um ativo", () => {
      novaAtribuicaoPage.visit();
      novaAtribuicaoPage.preencherFormulario({
        area: "Teste",
        subarea: "Teste",
        colaborador: "Teste",
        modalidade: "Presencial",
      });
      novaAtribuicaoPage.clickSalvar();

      cy.contains(/ativo não informado/i).should("be.visible");
      cy.contains("h6", "Nova Atribuição").should("be.visible");
    });
  });
});
