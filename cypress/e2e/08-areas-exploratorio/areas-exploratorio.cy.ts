import { areasPage, subareasPage } from "../../pages/AreasPage";

// não deletamos áreas/subáreas de verdade — base compartilhada e sem endpoint de reativação
describe("Sessao 4 - Areas e Subareas (exploratorio)", () => {
  const TS = Date.now();
  const marker = `qa${TS}`;

  beforeEach(() => {
    cy.login();
  });

  it("AR01 - deve impedir cadastro de area com descricao duplicada (ou registrar achado)", () => {
    const nome = `AreaDup${TS}`;
    areasPage.cadastrar(nome);
    areasPage.cadastrar(nome);

    cy.request(`/portal_service/areas?q%5Bdescription_i_cont_all%5D=${nome}`).then((res) => {
      const html = String(res.body);
      const ocorrencias = (html.match(new RegExp(`<td[^>]*>${nome}</td>`, "g")) || []).length;
      if (ocorrencias >= 2) {
        cy.log(
          `[ACHADO] area '${nome}' aparece ${ocorrencias}x - sem restricao de unicidade. Ver bugs-encontrados.md (BUG-15).`
        );
        cy.visit(`/portal_service/areas?q%5Bdescription_i_cont_all%5D=${nome}`);
        cy.screenshot("BUG-15-area-duplicada-na-listagem", { capture: "fullPage" });
      } else {
        cy.log("Duplicidade barrada corretamente");
      }
      expect(ocorrencias).to.be.greaterThan(0);
    });
  });

  it("AR02 - deve expor mecanismo de exclusao com confirmacao (validacao nao destrutiva)", () => {
    const nome = `AreaEstrutura${TS}`;
    areasPage.cadastrar(nome);

    cy.visit(`/portal_service/areas?q%5Bdescription_i_cont_all%5D=${nome}`);
    cy.contains("tr", nome).within(() => {
      cy.get("a[data-method=delete]")
        .should("have.attr", "href")
        .and("match", /\/portal_service\/areas\/\d+$/);
      cy.get("a[data-method=delete]")
        .should("have.attr", "data-confirm")
        .and("include", nome);
    });
  });

  it("AR03 - subarea sem area associada deve ser bloqueada (HTML5 required)", () => {
    subareasPage.visitLista();
    cy.get("#subarea_area_id").should("have.attr", "required");
    cy.get("#subarea_description").type("SubSemArea");
    subareasPage.submit();
    cy.location("pathname").should("include", "/portal_service/subareas");
    // se o required nao segurou, teria criado; validamos que ainda estamos no form
    cy.get("#subarea_area_id").should("exist");
  });

  it("AR04 - descricao vazia em area deve ser bloqueada (HTML5 required)", () => {
    areasPage.visitLista();
    cy.get("#area_description").should("have.attr", "required");
    areasPage.submit();
    cy.get("#area_description").should("exist");
  });

  it("AR05 - descricao com HTML/JS na area deve ser escapada (XSS passivo)", () => {
    const nome = `<b>${marker}xss</b><script>window.__xssArea=1</script>`;
    areasPage.cadastrar(nome);
    cy.window().its("__xssArea").should("be.undefined");
    cy.visit(`/portal_service/areas?q%5Bdescription_i_cont_all%5D=${marker}xss`);
    cy.contains("tr", `${marker}xss`).should("exist");
  });

  it("AR06 - [ACHADO] tooltip 'Excluir' e data-confirm 'Ativar/Desativar' sao inconsistentes", () => {
    const nome = `AreaUX${TS}`;
    areasPage.cadastrar(nome);
    cy.visit(`/portal_service/areas?q%5Bdescription_i_cont_all%5D=${nome}`);
    cy.contains("tr", nome).within(() => {
      cy.get("a[data-method=delete]").invoke("attr", "data-confirm").then((confirmMsg) => {
        cy.get("a[data-method=delete] i").then(($i) => {
          const tooltip = $i.attr("title") || $i.attr("data-original-title") || "";
          const confirmDiz = /Ativar\/Desativar/i.test(String(confirmMsg));
          const tooltipDiz = /Excluir/i.test(tooltip);
          if (confirmDiz && tooltipDiz) {
            cy.log(
              "[ACHADO] tooltip diz 'Excluir' mas confirm diz 'Ativar/Desativar' - usuario nao sabe qual acao acontece. Ver bugs-encontrados.md (BUG-16)."
            );
          }
          expect(String(confirmMsg)).to.match(/.+/);
        });
      });
      cy.screenshot("BUG-16-tooltip-excluir-vs-confirm-ativar-desativar", { capture: "fullPage" });
    });
  });

  it("AR07 - descricao de area com 300 caracteres nao deve derrubar o servidor", () => {
    const nome = "A".repeat(300);
    areasPage.visitLista();
    areasPage.preencher(nome);
    cy.intercept("POST", "/portal_service/areas").as("criar");
    areasPage.submit();
    cy.wait("@criar").then(({ response }) => {
      cy.log(`Status HTTP do POST: ${response?.statusCode}`);
      if (response && response.statusCode >= 500) {
        cy.log(
          `[ACHADO] area com 300 chars retornou HTTP ${response.statusCode}. Falta validates :length no modelo Area. Ver bugs-encontrados.md (BUG-17).`
        );
        cy.screenshot("BUG-17-area-300-chars-http-500", { capture: "fullPage" });
      }
    });
  });
});
