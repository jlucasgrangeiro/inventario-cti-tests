import { editarAtribuicaoPage } from "../../pages/EditarAtribuicaoPage";
import { observacaoDeTeste } from "../../support/testData";
import { criarAtribuicaoDeTeste } from "../../support/setup";

// setup cria 2 vínculos via UI (não há API de massa): um só-leitura pros negativos, outro mutável pra não cruzar estado entre testes
describe("US02 - Editar Atribuições", () => {
  let bondSomenteLeituraId: string;
  let bondMutavelId: string;

  before(() => {
    cy.login();
    criarAtribuicaoDeTeste(observacaoDeTeste("vínculo de apoio para consulta e casos negativos de edição")).then(
      (id) => {
        bondSomenteLeituraId = id;
      }
    );
    criarAtribuicaoDeTeste(observacaoDeTeste("vínculo de apoio para edição com persistência de alterações")).then(
      (id) => {
        bondMutavelId = id;
      }
    );
  });

  beforeEach(() => {
    cy.login();
  });

  context("Casos positivos", () => {
    it("deve carregar todos os campos preenchidos anteriormente ao abrir para edição", () => {
      editarAtribuicaoPage.visit(bondSomenteLeituraId);
      cy.get("#set_area").find("option:selected").should("have.text", "Teste");
      cy.get("#resp_subarea").find("option:selected").should("have.text", "Teste");
      cy.get("#collaborators").find("option:selected").should("have.text", "Teste");
      cy.get("#bond_modality_presencial").should("be.checked");
    });

    it("deve exibir a seção 'Ativos da Atribuição' com tombo, descrição e status de cada ativo vinculado", () => {
      editarAtribuicaoPage.visit(bondSomenteLeituraId);
      editarAtribuicaoPage.quantidadeDeAtivos().should("be.gte", 1);
      cy.get("#bond_asset .add_ativo")
        .first()
        .within(() => {
          cy.get("select#set_tombo option:selected").invoke("text").should("not.be.empty");
          cy.get("select#set_description option:selected").invoke("text").should("not.be.empty");
          cy.get("select#set_status option:selected").invoke("text").should("not.be.empty");
        });
    });

    it("deve descartar alterações não salvas ao clicar em Cancelar", () => {
      editarAtribuicaoPage.visit(bondSomenteLeituraId);
      editarAtribuicaoPage.selecionarModalidade("Home Office");
      editarAtribuicaoPage.clickCancelar();

      cy.location("pathname").should("eq", "/portal_service/bonds");
      editarAtribuicaoPage.visit(bondSomenteLeituraId);
      cy.get("#bond_modality_presencial").should("be.checked");
    });

    it("deve permitir modificar a modalidade e manter a integridade dos dados após salvar", () => {
      editarAtribuicaoPage.visit(bondMutavelId);
      editarAtribuicaoPage.selecionarModalidade("Home Office");
      editarAtribuicaoPage.selecionarAtendidoPor();
      editarAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", "/portal_service/bonds");
      cy.contains(/atualizad[ao] com sucesso|parabéns/i).should("be.visible");

      editarAtribuicaoPage.visit(bondMutavelId);
      cy.get("#bond_modality_home_office").should("be.checked");
    });

    it("deve permitir adicionar um novo ativo à atribuição existente", () => {
      editarAtribuicaoPage.visit(bondMutavelId);
      editarAtribuicaoPage.quantidadeDeAtivos().then((qtdAntes) => {
        cy.obterTombosDisponiveis().then((tombos) => {
          editarAtribuicaoPage.selecionarAtendidoPor();
          editarAtribuicaoPage.salvarComPrimeiroAtivoAceito(tombos);
          cy.location("pathname").should("eq", "/portal_service/bonds");

          editarAtribuicaoPage.visit(bondMutavelId);
          editarAtribuicaoPage.quantidadeDeAtivos().should("eq", qtdAntes + 1);
        });
      });
    });

    it("fluxo de substituição: marca ativo como DISPONÍVEL, remove e adiciona um novo ativo", () => {
      editarAtribuicaoPage.visit(bondMutavelId);
      editarAtribuicaoPage.primeiroTomboDaAtribuicao().then((tombo) => {
        editarAtribuicaoPage.marcarStatusAtivo(tombo, "DISPONÍVEL");
        editarAtribuicaoPage.removerAtivo(tombo);
      });
      cy.obterTombosDisponiveis().then((tombos) => {
        editarAtribuicaoPage.selecionarAtendidoPor();
        editarAtribuicaoPage.salvarComPrimeiroAtivoAceito(tombos);
      });
      cy.location("pathname").should("eq", "/portal_service/bonds");
      cy.contains(/atualizad[ao] com sucesso|parabéns/i).should("be.visible");
    });

    it("fluxo de defeito: marca ativo como COM DEFEITO, informa o defeito, remove e adiciona um novo ativo", () => {
      editarAtribuicaoPage.visit(bondMutavelId);
      editarAtribuicaoPage.primeiroTomboDaAtribuicao().then((tombo) => {
        editarAtribuicaoPage.marcarStatusAtivo(tombo, "COM DEFEITO");
        editarAtribuicaoPage.informarDefeito(tombo, "Defeito na fonte de alimentação (teste automatizado)");
        editarAtribuicaoPage.removerAtivo(tombo);
      });
      cy.obterTombosDisponiveis().then((tombos) => {
        editarAtribuicaoPage.selecionarAtendidoPor();
        editarAtribuicaoPage.salvarComPrimeiroAtivoAceito(tombos);
      });
      cy.location("pathname").should("eq", "/portal_service/bonds");
      cy.contains(/atualizad[ao] com sucesso|parabéns/i).should("be.visible");
    });

    it("deve permitir editar as Observações e persistir o novo texto", () => {
      const novaObservacao = observacaoDeTeste("observações atualizadas via edição");

      editarAtribuicaoPage.visit(bondMutavelId);
      cy.get("#bond_observation").clear().type(novaObservacao);
      editarAtribuicaoPage.selecionarAtendidoPor();
      editarAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", "/portal_service/bonds");
      editarAtribuicaoPage.visit(bondMutavelId);
      cy.get("#bond_observation").should("have.value", novaObservacao);
    });

    it("deve permitir trocar o Colaborador responsável pela atribuição (quando houver outro disponível)", () => {
      editarAtribuicaoPage.visit(bondMutavelId);
      cy.get("#collaborators").then(($select) => {
        const atual = $select.find("option:selected").text().trim();
        const outras = $select
          .find("option")
          .filter((_, o) => {
            const opt = o as HTMLOptionElement;
            return opt.value !== "" && opt.text.trim() !== atual;
          });

        if (outras.length === 0) {
          // área "Teste" pode ter um único colaborador no QA, valida apenas editabilidade
          cy.log("Apenas um colaborador disponível na área — validando editabilidade do campo");
          cy.wrap($select).should("be.enabled");
          return;
        }

        const novoColaborador = outras.eq(0).text().trim();
        cy.wrap($select).select(outras.eq(0).val() as string, { force: true });
        editarAtribuicaoPage.selecionarAtendidoPor();
        editarAtribuicaoPage.clickSalvar();

        cy.location("pathname").should("eq", "/portal_service/bonds");
        editarAtribuicaoPage.visit(bondMutavelId);
        cy.get("#collaborators").find("option:selected").should("have.text", novoColaborador);
      });
    });
  });

  context("Casos negativos", () => {
    it("não deve permitir salvar removendo um campo obrigatório (Área)", () => {
      editarAtribuicaoPage.visit(bondSomenteLeituraId);
      cy.get("#set_area").select("");
      editarAtribuicaoPage.clickSalvar();

      cy.location("pathname").should("eq", `/portal_service/bonds/${bondSomenteLeituraId}/edit`);
      editarAtribuicaoPage.campoDeveEstarInvalido("#set_area");
    });

    it("não deve permitir salvar uma atribuição sem nenhum ativo vinculado", () => {
      editarAtribuicaoPage.visit(bondSomenteLeituraId);
      editarAtribuicaoPage.primeiroTomboDaAtribuicao().then((tombo) => {
        editarAtribuicaoPage.removerAtivo(tombo);
      });
      editarAtribuicaoPage.selecionarAtendidoPor();
      editarAtribuicaoPage.clickSalvar();

      cy.contains(/ativo não informado/i).should("be.visible");
    });
  });
});
