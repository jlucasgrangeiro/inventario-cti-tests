import { colaboradoresPage } from "../../pages/ColaboradoresPage";

// sessão 2 do plano — Colaboradores (User model, /portal_service/users)
// form só tem nome (required) e e-mail (não required); U02/U03 (CPF) não se aplicam, não existe esse campo
describe("Sessao 2 - Colaboradores (exploratorio)", () => {
  const TS = Date.now();
  const uniq = (label: string) => `qa-${label}-${TS}-${Math.floor(Math.random() * 1e4)}`;

  beforeEach(() => {
    cy.login();
  });

  it("U01 - deve impedir cadastro de colaborador com e-mail duplicado (ou registrar achado)", () => {
    const email = `${uniq("dup")}@qa.local`;
    const nome1 = `QA Dup 1 ${TS}`;
    const nome2 = `QA Dup 2 ${TS}`;

    colaboradoresPage.cadastrar({ nome: nome1, email });
    cy.url().should("include", "/portal_service/users");

    colaboradoresPage.cadastrar({ nome: nome2, email });

    cy.location("pathname").then((path) => {
      cy.get("body").invoke("text").then((txt) => {
        const barrouNoForm =
          path.includes("/new") &&
          /j.*(cadastrad|utilizad|existe)|duplicad|taken|unique|invalid/i.test(txt);

        if (barrouNoForm) {
          cy.log("Duplicidade barrada corretamente no formulario");
        } else {
          cy.request("/portal_service/users").then((res) => {
            const escaped = email.replace(/[.@\-]/g, "\\$&");
            const ocorrencias = (String(res.body).match(new RegExp(escaped, "g")) || []).length;
            if (ocorrencias >= 2) {
              cy.log(
                `[ACHADO] e-mail '${email}' aparece ${ocorrencias}x na listagem - sem restricao de unicidade. Ver bugs-encontrados.md (BUG-13).`
              );
              cy.visit(`/portal_service/users?q%5Bname_i_cont_all%5D=QA%20Dup%20${TS}`);
              cy.screenshot("BUG-13-email-duplicado-na-listagem", { capture: "fullPage" });
            } else {
              cy.log("Nao foi possivel confirmar duplicidade; investigar manualmente.");
            }
          });
        }
      });
    });
  });

  it("U04 - deve aceitar acentos e preservar/normalizar espacos multiplos no nome", () => {
    const marker = `NevesAc${TS}`;
    const nome = `Joao   das   ${marker}`;
    const email = `${uniq("acento")}@qa.local`;
    colaboradoresPage.cadastrar({ nome, email });

    // busca via ransack q[name_i_cont_all]
    cy.visit(`/portal_service/users?q%5Bname_i_cont_all%5D=${marker}`);
    cy.contains("tr", marker).should("exist");
    cy.contains("tr", marker).invoke("text").then((txt) => {
      if (/Joao\s{2,}das\s{2,}/.test(txt)) {
        cy.log("[ACHADO] espacos multiplos preservados no nome - pode gerar duplicatas visuais.");
      }
    });
  });

  it("U05 - deve escapar HTML/JS no nome (XSS passivo)", () => {
    const marcador = `xss${TS}`;
    const nome = `<b>${marcador}</b><script>window.__xss=1</script>`;
    const email = `${uniq("xss")}@qa.local`;
    colaboradoresPage.cadastrar({ nome, email });

    cy.url().should("include", "/portal_service/users");

    cy.window().its("__xss").should("be.undefined");

    cy.visit(`/portal_service/users?q%5Bname_i_cont_all%5D=${marcador}`);
    cy.contains("tr", marcador).should("exist");
  });

  it("U06 - [ACHADO] nome com 300 caracteres derruba o servidor (HTTP 500)", () => {
    const nome = "A".repeat(300);
    const email = `${uniq("long")}@qa.local`;

    colaboradoresPage.visitNovo();
    colaboradoresPage.preencher({ nome, email });

    cy.intercept("POST", "/portal_service/users").as("criar");
    colaboradoresPage.submit();

    cy.wait("@criar").then(({ response }) => {
      cy.log(`Status HTTP do POST: ${response?.statusCode}`);
      if (response && response.statusCode >= 500) {
        cy.log(
          `[ACHADO] cadastro de nome com 300 caracteres retornou HTTP ${response.statusCode}. ` +
            "Falta validacao de tamanho maximo no modelo User (esperado erro amigavel, nao 500). " +
            "Ver bugs-encontrados.md (BUG-14)."
        );
        cy.screenshot("BUG-14-nome-longo-http-500", { capture: "fullPage" });
      } else {
        cy.log("Sistema tratou nome longo sem erro 5xx.");
      }
    });
  });

  // não executa a inativação de fato pra não sujar a base compartilhada com outros testadores
  it("U07 - deve expor mecanismo de inativacao com confirmacao (validacao nao destrutiva)", () => {
    const nome = `QA Estrutura ${TS}`;
    const email = `${uniq("estr")}@qa.local`;
    colaboradoresPage.cadastrar({ nome, email });

    cy.visit(`/portal_service/users?q%5Bname_i_cont_all%5D=QA%20Estrutura%20${TS}`);
    cy.contains("tr", nome).should("exist");

    {
      cy.contains("tr", nome).within(() => {
        cy.get("a[data-method=delete]")
          .should("have.attr", "href")
          .and("match", /\/portal_service\/users\/\d+$/);
        cy.get("a[data-method=delete]")
          .should("have.attr", "data-confirm")
          .and("match", /Ativar\/Desativar/i);
        // Bootstrap move title pra data-original-title depois do init do tooltip
        cy.get("a[data-method=delete] i").then(($i) => {
          const t = $i.attr("title") || $i.attr("data-original-title") || "";
          expect(t).to.match(/Inativar/i);
        });
      });
      cy.contains("tr", nome).find("td").eq(2).invoke("text").then((t) => {
        expect(t.trim()).to.match(/^N(a|ã)o$/i);
      });
    }
  });

  it("U08 - [ACHADO] campo e-mail do colaborador nao usa type=email", () => {
    colaboradoresPage.visitNovo();
    cy.get("#user_email").should("have.attr", "type", "text");
    cy.log(
      "[ACHADO] #user_email deveria ser type=email para dispararmos a validacao nativa do browser e teclado apropriado em mobile. Ver bugs-encontrados.md (BUG-11)."
    );
    cy.screenshot("BUG-11-email-sem-type-email", { capture: "fullPage" });
  });

  it("U09 - [ACHADO] permite cadastrar colaborador sem e-mail", () => {
    const nome = `QA SemEmail${TS}`;
    colaboradoresPage.visitNovo();
    cy.get("#user_email").should("not.have.attr", "required");
    colaboradoresPage.preencher({ nome, email: "" });
    colaboradoresPage.submit();

    cy.location("pathname").then((path) => {
      if (!path.includes("/new")) {
        cy.log(
          "[ACHADO] colaborador foi cadastrado sem e-mail - dificulta emissao de termos e comunicacao. Ver bugs-encontrados.md (BUG-12)."
        );
        cy.visit(`/portal_service/users?q%5Bname_i_cont_all%5D=SemEmail${TS}`);
        cy.contains("tr", nome).should("exist");
        cy.screenshot("BUG-12-colaborador-sem-email", { capture: "fullPage" });
      } else {
        cy.log("Sistema barrou o cadastro sem e-mail (comportamento server-side).");
      }
    });
  });

  it("U10 - deve bloquear submit quando nome esta em branco", () => {
    colaboradoresPage.visitNovo();
    cy.get("#user_name").should("have.attr", "required");
    colaboradoresPage.submit();
    cy.url().should("include", "/portal_service/users/new");
  });
});
