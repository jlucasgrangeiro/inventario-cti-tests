import { novaAtribuicaoPage } from "../pages/NovaAtribuicaoPage";
import { atribuicoesListPage } from "../pages/AtribuicoesListPage";

// sem API de massa de dados — cria a própria atribuição em vez de usar a primeira da listagem compartilhada
export function criarAtribuicaoDeTeste(observacao: string): Cypress.Chainable<string> {
  novaAtribuicaoPage.visit();
  novaAtribuicaoPage.preencherFormulario({
    area: "Teste",
    subarea: "Teste",
    colaborador: "Teste",
    modalidade: "Presencial",
    observacoes: observacao,
  });
  return cy.obterTombosDisponiveis().then((tombos) => {
    novaAtribuicaoPage.salvarComPrimeiroAtivoAceito(tombos);
    cy.location("pathname").should("eq", "/portal_service/bonds");
    return atribuicoesListPage.primeiroBondIdDaListagem();
  });
}
