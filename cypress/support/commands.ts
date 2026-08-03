/// <reference types="cypress" />

// form de login é Devise/Rails, fica na raiz "/" mesmo (não tem /login)
Cypress.Commands.add(
  "login",
  (
    email: string = Cypress.env("USER_EMAIL"),
    password: string = Cypress.env("USER_PASSWORD")
  ) => {
    cy.session(
      [email, password],
      () => {
        cy.visit("/");
        cy.get("#admin_email").type(email);
        cy.get("#admin_password").type(password, { log: false });
        cy.get("input[type=submit][name=commit]").click();
        cy.get("#admin_email").should("not.exist");
      },
      {
        validate: () => {
          cy.visit("/");
          cy.get("#admin_email").should("not.exist");
        },
      }
    );
  }
);

// depósito lista como DISPONÍVEL ativos que o backend às vezes recusa (concorrência no QA
// compartilhado) — busca em páginas aleatórias e devolve uma lista pra tentar o próximo em caso de recusa
const extrairTombosDisponiveis = (html: string): string[] => {
  const $doc = Cypress.$(html);
  return $doc
    .find("table tbody tr")
    .filter((_, tr) => Cypress.$(tr).find("td").eq(3).text().trim() === "DISPONÍVEL")
    .map((_, tr) => Cypress.$(tr).find("td").eq(1).text().trim())
    .get();
};

Cypress.Commands.add("obterTombosDisponiveis", (quantidade = 20) => {
  const paginas = Cypress._.uniq([Cypress._.random(1, 150), Cypress._.random(1, 150), Cypress._.random(1, 150)]);
  let tombos: string[] = [];

  return cy
    .wrap(paginas, { log: false })
    .each((pagina: number) => {
      cy.request(`/portal_service/deposits?page=${pagina}`).then((response) => {
        tombos = tombos.concat(extrairTombosDisponiveis(response.body as string));
      });
    })
    .then(() => {
      tombos = Cypress._.shuffle(Cypress._.uniq(tombos)).slice(0, quantidade);
      expect(tombos, "tombos disponíveis encontrados no Depósito CTI").to.not.be.empty;
      return tombos;
    });
});

export {};
