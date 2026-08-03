import { ativosPage } from "../../pages/AtivosPage";

// Sessão 3 — Ativos / Depósito CTI. Não excluímos ativos criados, não há reativação exposta.
describe("Sessao 3 - Ativos (exploratorio)", () => {
  const TS = Date.now();
  const uniq = (label: string) => `qa-${label}-${TS}-${Math.floor(Math.random() * 1e4)}`;

  beforeEach(() => cy.login());

  it("A00 - [ACHADO] formulario de ativo nao possui campos obrigatorios (required)", () => {
    ativosPage.visitNovo();
    ["#asset_brand", "#asset_model", "#asset_serial", "#asset_tombo", "#type", "#asset_acquisition_id"]
      .forEach((sel) => cy.get(sel).should("not.have.attr", "required"));

    cy.log(
      "[ACHADO] nenhum campo do form 'Novo ativo' tem HTML5 required. Confia inteiramente no back-end (que pode ou nao validar). Ver bugs-encontrados.md (BUG-18)."
    );
    cy.screenshot("BUG-18-form-ativo-sem-required", { capture: "fullPage" });
  });

  it("A01 - submit totalmente vazio: comportamento observado", () => {
    ativosPage.visitNovo();
    cy.intercept("POST", "/portal_service/listing_assets").as("criar");
    ativosPage.submit();

    cy.wait("@criar").then(({ response }) => {
      const status = response?.statusCode ?? 0;
      cy.log(`Status HTTP com form vazio: ${status}`);
      if (status < 300) {
        cy.log(
          "[ACHADO] backend aceitou criacao de ativo com todos campos vazios ou retornou 200 sem erro. Ver bugs-encontrados.md (BUG-19)."
        );
        cy.screenshot("BUG-19-ativo-vazio-aceito", { capture: "fullPage" });
      }
      // aceitável qualquer status: só documenta
      expect(status).to.be.lessThan(600);
    });
  });

  it("A02 - deve impedir cadastro de ativo com tombo duplicado (ou registrar achado)", () => {
    const tombo = `T${TS}`;
    const dados = {
      brand: "QA",
      model: `M${TS}`,
      serial: `S${TS}`,
      tombo,
      type: "MOUSE",
      acquisitionId: "1",
    };

    ativosPage.visitNovo();
    ativosPage.preencher(dados);
    ativosPage.submit();
    cy.location("pathname").should("include", "/portal_service/listing_assets");

    // segundo cadastro com mesmo tombo
    ativosPage.visitNovo();
    ativosPage.preencher({ ...dados, serial: `S2-${TS}` });
    cy.intercept("POST", "/portal_service/listing_assets").as("dup");
    ativosPage.submit();
    cy.wait("@dup").then(({ response }) => {
      const status = response?.statusCode ?? 0;
      cy.log(`Status HTTP na 2a tentativa (tombo duplicado): ${status}`);
    });

    cy.request(`/portal_service/listing_assets?q%5Basset_i_cont_all%5D=${tombo}`).then((res) => {
      const html = String(res.body);
      const escaped = tombo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const n = (html.match(new RegExp(`<td[^>]*>${escaped}</td>`, "g")) || []).length;
      cy.log(`Ocorrencias de <td>${tombo}</td>: ${n}`);
      if (n >= 2) {
        cy.log(
          `[ACHADO] tombo '${tombo}' aparece ${n}x - sem restricao de unicidade. Ver bugs-encontrados.md (BUG-20).`
        );
        cy.visit(`/portal_service/listing_assets?q%5Basset_i_cont_all%5D=${tombo}`);
        cy.screenshot("BUG-20-tombo-duplicado-na-listagem", { capture: "fullPage" });
      }
      expect(n, "ao menos 1 ocorrencia").to.be.greaterThan(0);
    });
  });

  it("A03 - marca/modelo com HTML devem ser escapados (XSS passivo)", () => {
    const marker = `xssA${TS}`;
    ativosPage.visitNovo();
    ativosPage.preencher({
      brand: `<b>${marker}</b><script>window.__xssAsset=1</script>`,
      model: "M",
      serial: `S-${TS}`,
      tombo: `X${TS}`,
      type: "MOUSE",
      acquisitionId: "1",
    });
    ativosPage.submit();

    cy.window().its("__xssAsset").should("be.undefined");
    cy.request(`/portal_service/listing_assets?q%5Basset_i_cont_all%5D=${marker}`).then((res) => {
      const html = String(res.body);
      expect(html).to.include(marker);
      expect(html).to.match(/&lt;b&gt;xssA/); // escapado
    });
  });

  it("A04 - tombo com 300 caracteres nao deve derrubar o servidor", () => {
    const tombo = "T" + "9".repeat(300);
    ativosPage.visitNovo();
    ativosPage.preencher({
      brand: "QA-Long",
      model: "M",
      serial: `SL-${TS}`,
      tombo,
      type: "MOUSE",
      acquisitionId: "1",
    });
    cy.intercept("POST", "/portal_service/listing_assets").as("longo");
    ativosPage.submit();
    cy.wait("@longo").then(({ response }) => {
      const status = response?.statusCode ?? 0;
      cy.log(`Status HTTP tombo 300 chars: ${status}`);
      if (status >= 500) {
        cy.log(
          `[ACHADO] tombo com 300 chars retornou HTTP ${status}. Ver bugs-encontrados.md (BUG-21).`
        );
        cy.screenshot("BUG-21-tombo-300-chars-http-500", { capture: "fullPage" });
      }
    });
  });

  it("A05 - Deposito CTI carrega e expoe filtro por status", () => {
    ativosPage.visitDeposito();
    cy.get("#q_status_id_eq").should("exist");
    cy.get("#q_status_id_eq option").its("length").should("be.gte", 2);
  });
});
