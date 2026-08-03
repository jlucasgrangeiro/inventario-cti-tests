// Sessão 6 — aprofunda consequências dos bugs já mapeados nas sessões anteriores
describe("Sessao 6 - Aprofundar bugs mapeados (exploratorio)", () => {
  const TS = Date.now();

  beforeEach(() => cy.login());

  it("B01 - se atribuicao foi salva sem subarea, listagem exibe algum indicador?", () => {
    cy.request("/portal_service/bonds").then((res) => {
      const html = String(res.body);
      // procura linhas onde a subarea aparece como vazio/hifen/etc
      const linhasVazias = (html.match(/<td[^>]*>\s*(-|—|<\/td>)/g) || []).length;
      cy.log(`Ocorrencias de celulas "vazias" na listagem de bonds: ${linhasVazias}`);
      // meramente informativo — o objetivo é registrar que o dado inválido persiste
      expect(res.status).to.eq(200);
    });
  });

  // não destrutivo: só inspeciona o schema do form, não chega a criar o vínculo
  it("B02 - form 'Nova atribuicao' expoe campo modalidade sem required", () => {
    cy.visit("/portal_service/bonds/new");
    cy.get("body").then(($body) => {
      // procura select/checkbox de work_from ou similar
      const workFieldExiste = $body.find("[name*='work'], [id*='work']").length > 0;
      if (workFieldExiste) {
        cy.get("[name*='work'], [id*='work']").first().then(($el) => {
          const req = $el.attr("required");
          if (!req) {
            cy.log(
              "[ACHADO] campo de Modalidade nao possui required (confirma BUG-05). Ver bugs-encontrados.md."
            );
          }
        });
      } else {
        cy.log("Campo 'work_from' nao encontrado no HTML atual; investigar naming.");
      }
    });
  });

  it("B03 - endpoint de geracao de termos com selecao vazia: resposta observada", () => {
    const csrfPromise = cy.request("/portal_service/bonds").then((res) => {
      return String(res.body).match(/name="csrf-token" content="([^"]+)"/)?.[1] ?? "";
    });

    csrfPromise.then((csrf) => {
      cy.request({
        method: "POST",
        url: "/portal_service/bonds/generate_terms",
        headers: { "X-CSRF-Token": csrf, Accept: "text/html" },
        form: true,
        body: { bonds_ids: [] },
        failOnStatusCode: false,
      }).then((res) => {
        cy.log(`Status HTTP com bonds_ids vazio: ${res.status}`);
        // não deveria retornar 500 nem PDF vazio
        expect(res.status, "esperado 4xx amigavel ou 3xx com flash").to.be.lessThan(500);
      });
    });
  });

  it("B04 - dropdown de Subarea em 'Nova atribuicao' expoe todas subareas (nao filtra por Area)", () => {
    cy.visit("/portal_service/bonds/new");
    cy.get("select[name*='subarea'], #bond_subarea_id, [id*='subarea_id']")
      .then(($sel) => {
        if ($sel.length === 0) {
          cy.log("Select de subarea nao encontrado; naming pode ter mudado.");
          return;
        }
        const total = $sel.first().find("option").length;
        cy.log(`Opcoes de subarea disponiveis (sem filtro por area): ${total}`);
        if (total > 3) {
          cy.log(
            "[ACHADO] combo de subarea expoe todas as subareas do sistema, sem filtrar pela area selecionada (confirma BUG-06)."
          );
        }
      });
  });

  it("B05 - Cache-Control em resposta HTML autenticada", () => {
    cy.request("/portal_service/home/index").then((res) => {
      const cache = String(res.headers["cache-control"] || "").toLowerCase();
      cy.log(`Cache-Control: '${cache}'`);
      if (!cache.includes("no-store") && !cache.includes("no-cache") && !cache.includes("private")) {
        cy.log(
          "[ACHADO] pagina autenticada nao envia Cache-Control restritivo (agrava BUG-10). Ver bugs-encontrados.md."
        );
      }
      expect(res.status).to.eq(200);
    });
  });
});
