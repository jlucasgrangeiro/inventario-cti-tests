import { colaboradoresPage } from "../../pages/ColaboradoresPage";

// Sessão 5 — Transversal / UX. T02 (teclado) e T03 (responsividade) ficaram de fora, são visuais/manuais.
describe("Sessao 5 - Transversal / UX (exploratorio)", () => {
  const TS = Date.now();

  beforeEach(() => cy.login());

  it("T01 - duplo clique em 'Criar' colaborador nao deve gerar duplicata", () => {
    const nome = `QA T01 ${TS}`;
    const email = `qa-t01-${TS}@qa.local`;

    colaboradoresPage.visitNovo();
    colaboradoresPage.preencher({ nome, email });

    cy.get("input[type=submit][name=commit]").as("submit");
    // rails-ujs desabilita via data-disable-with no 1º clique
    cy.get("@submit")
      .should("have.attr", "data-disable-with")
      .and("match", /Criar|Salvar|Enviar/i);

    cy.get("@submit").dblclick();

    // busca pelo email exato — apenas 1 ocorrência esperada
    cy.request(
      `/portal_service/users?q%5Bname_i_cont_all%5D=T01%20${TS}`
    ).then((res) => {
      const html = String(res.body);
      const n = (html.match(new RegExp(email.replace(/[.@\-]/g, "\\$&"), "g")) || []).length;
      cy.log(`Ocorrencias de '${email}': ${n}`);
      expect(n, "colaborador deve existir exatamente 1 vez").to.equal(1);
    });
  });

  it("T04 - voltar apos salvar nao reenvia o POST (PRG pattern)", () => {
    const nome = `QA T04 ${TS}`;
    const email = `qa-t04-${TS}@qa.local`;

    colaboradoresPage.cadastrar({ nome, email });
    cy.location("pathname").should("include", "/portal_service/users");

    cy.go("back");
    // se a resposta ao POST foi 302 (PRG), o back leva ao /new e não repete o create
    cy.request(
      `/portal_service/users?q%5Bname_i_cont_all%5D=T04%20${TS}`
    ).then((res) => {
      const html = String(res.body);
      const n = (html.match(new RegExp(email.replace(/[.@\-]/g, "\\$&"), "g")) || []).length;
      expect(n, "sem duplicata gerada pelo back").to.equal(1);
    });
  });

  it("T05 - rota interna sem sessao redireciona para /sign_in", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.request({
      url: "/portal_service/bonds",
      followRedirect: false,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status, "esperado redirect").to.be.oneOf([301, 302, 303]);
      expect(String(res.headers.location || "")).to.match(/sign_in|admins/i);
    });
  });

  it("T06 - listagem de vinculos e idempotente em leituras consecutivas", () => {
    const url = "/portal_service/bonds";
    cy.request(url).then((r1) => {
      cy.request(url).then((r2) => {
        expect(r1.status).to.eq(r2.status);
        const diff = Math.abs(String(r1.body).length - String(r2.body).length);
        // variação por CSRF token / flash, mas não deveria ser grande
        expect(diff, "variacao de tamanho da resposta").to.be.lessThan(2000);
      });
    });
  });

  it("T07 - pagina autenticada expoe meta CSRF (Rails/Devise)", () => {
    cy.visit("/portal_service/home/index");
    cy.get('meta[name="csrf-token"]').should("have.attr", "content").and("have.length.gt", 20);
    cy.get('meta[name="csrf-param"]').should("have.attr", "content", "authenticity_token");
  });

  it("T08 - todos os links da sidebar autenticada respondem 2xx/3xx", () => {
    cy.visit("/portal_service/home/index");
    cy.get("#accordionSidebar a[href^='/portal_service/']")
      .then(($links) => {
        const hrefs = Array.from(
          new Set(
            Array.from($links)
              .map((a) => a.getAttribute("href") || "")
              .filter((h) => h && !h.includes("#"))
          )
        );
        expect(hrefs.length, "sidebar tem links").to.be.gte(4);

        hrefs.forEach((href) => {
          cy.request({ url: href, failOnStatusCode: false }).then((res) => {
            cy.log(`${res.status} ${href}`);
            expect(res.status, `link ${href}`).to.be.lessThan(400);
          });
        });
      });
  });
});
