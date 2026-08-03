import { loginPage } from "../../pages/LoginPage";

// sessão 1 do plano exploratório (docs/plano-de-teste.md §8) — checagens passivas de segurança/UX no login
// L09, L10 e L12 ficaram de fora (multi-login, timeout, esqueci senha) e são manuais
describe("Sessão 1 — Login (exploratório automatizado)", () => {
  const EMAIL_VALIDO = Cypress.env("USER_EMAIL") as string;
  const SENHA_VALIDA = Cypress.env("USER_PASSWORD") as string;

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    loginPage.visit();
  });

  const capturarMensagemErro = (): Cypress.Chainable<string> => {
    return cy.get("body").invoke("text").then((t) => (t as unknown as string).toLowerCase());
  };

  context("Enumeração de usuários", () => {
    it("L01/L02 — mensagem para e-mail inexistente e senha errada deve ser a MESMA (evitar enumeração)", () => {
      loginPage.tentar("naoexiste-" + Date.now() + "@teste.com", "qualquerSenha123");
      capturarMensagemErro().then((textoInexistente) => {
        loginPage.visit();
        loginPage.tentar(EMAIL_VALIDO, "senhaErradaMasFormatoOk123");
        capturarMensagemErro().then((textoSenhaErrada) => {
          const re = /(inv[aá]lid|incorret|n[aã]o (encontrad|existe)|credenc)/i;
          const trechoA = (textoInexistente.match(re) || [""])[0];
          const trechoB = (textoSenhaErrada.match(re) || [""])[0];
          cy.log(`Mensagem (e-mail inexistente): "${trechoA}"`);
          cy.log(`Mensagem (senha errada): "${trechoB}"`);
          if (trechoA && trechoB) {
            expect(trechoA, "mensagens devem ser idênticas para evitar enumeração").to.eq(trechoB);
          } else {
            cy.log("Não foi possível identificar mensagem de erro nas duas respostas — verificar manualmente");
          }
        });
      });
    });
  });

  context("Validação de campos", () => {
    it("[ACHADO] L03 — campo de e-mail não possui atributo required (BUG-08)", () => {
      cy.get("#admin_email").then(($el) => {
        const input = $el[0] as HTMLInputElement;
        cy.log(`#admin_email.required = ${input.required}, validity.valid (vazio) = ${input.validity.valid}`);
        expect(input.required, "ACHADO: campo não está marcado como required").to.eq(false);
      });
      loginPage.submit();
      cy.get("#admin_email").should("be.visible");
      cy.screenshot("BUG-08-email-sem-required", { capture: "fullPage" });
    });

    it("L04 — não deve permitir submit com e-mail em formato inválido", () => {
      loginPage.preencher("qa.teste", "qualquerSenha123");
      loginPage.submit();
      cy.get("#admin_email").then(($el) => {
        const input = $el[0] as HTMLInputElement;
        expect(input.type, "campo de e-mail deveria ter type=email para validação nativa").to.eq("email");
        expect(input.validity.valid, "formato de e-mail deve ser inválido").to.eq(false);
      });
    });
  });

  context("Atributos de segurança do formulário", () => {
    it("L05 — campo de senha deve ser type=password (não expor caracteres)", () => {
      cy.get("#admin_password").should("have.attr", "type", "password");
    });

    it("[ACHADO] L06 — campo senha sem autocomplete='current-password' (BUG-09, OWASP ASVS V2.10.4)", () => {
      cy.get("#admin_password").then(($el) => {
        const autocomplete = ($el.attr("autocomplete") || "").toLowerCase();
        cy.log(`autocomplete real do campo senha: "${autocomplete || "(atributo ausente)"}"`);
        expect(
          ["current-password", "off"],
          "ACHADO: recomenda-se 'current-password' ou 'off'"
        ).to.not.include(autocomplete);
      });
      cy.screenshot("BUG-09-senha-sem-autocomplete", { capture: "fullPage" });
    });
  });

  context("Invalidação de sessão", () => {
    it("[ACHADO] L07 — conteúdo interno é reexposto ao clicar 'voltar' após logout (BUG-10, OWASP ASVS V3.2.3)", () => {
      cy.login();
      cy.visit("/portal_service/bonds");
      cy.location("pathname").should("eq", "/portal_service/bonds");

      cy.get("body").then(($body) => {
        const link = $body.find('a:contains("Sair"), a[href*="sign_out"]').first();
        if (link.length === 0) {
          throw new Error("Link de logout não encontrado — ajustar seletor");
        }
        cy.wrap(link).click({ force: true });
      });
      cy.get("#admin_email").should("be.visible");

      cy.go("back");
      cy.screenshot("BUG-10-conteudo-reexposto-apos-voltar", { capture: "fullPage" });
      cy.get("body").then(($body) => {
        const reexpos = $body.find("#admin_email").length === 0;
        cy.log(`Após voltar: conteúdo interno reexposto? ${reexpos}`);
        expect(reexpos, "ACHADO reproduzido: página interna reapareceu após logout+voltar").to.eq(true);
      });
    });

    it("L08 — acesso direto a URL interna sem sessão deve redirecionar para login", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.request({
        url: "/portal_service/bonds",
        followRedirect: false,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status, "resposta deve ser um redirect (3xx)").to.be.within(300, 399);
        const location = (response.headers["location"] || "") as string;
        expect(location.toLowerCase(), "location deve apontar para tela de login").to.match(/sign_in|\/$/);
      });
    });
  });

  context("Headers HTTP de segurança", () => {
    it("L11 — deve inspecionar presença de headers de segurança na resposta da raiz", () => {
      cy.request("/").then((response) => {
        const h = response.headers as Record<string, string>;
        const chaves = Object.keys(h).map((k) => k.toLowerCase());
        cy.log("Headers presentes: " + chaves.join(", "));

        const cobertos = {
          "x-frame-options": chaves.includes("x-frame-options"),
          "content-security-policy": chaves.includes("content-security-policy"),
          "strict-transport-security": chaves.includes("strict-transport-security"),
          "x-content-type-options": chaves.includes("x-content-type-options"),
          "referrer-policy": chaves.includes("referrer-policy"),
        };
        cy.log("Cobertura de headers: " + JSON.stringify(cobertos));

        const ausentes = Object.entries(cobertos).filter(([, v]) => !v).map(([k]) => k);
        if (ausentes.length > 0) {
          cy.log(`ACHADO: headers de segurança ausentes: ${ausentes.join(", ")}`);
        }

        expect(chaves.length, "resposta deve conter headers").to.be.gte(1);
      });
    });
  });

  context("Verificação passiva de sanitização", () => {
    it("L13 — aspas simples no e-mail não devem revelar erro de banco/framework na resposta", () => {
      loginPage.tentar("a'@teste.com", "qualquerSenha123");
      capturarMensagemErro().then((texto) => {
        const vazamentos = [
          /pg::/i,
          /activerecord/i,
          /sql\s*syntax/i,
          /psql/i,
          /stacktrace|traceback/i,
          /syntax error at or near/i,
        ];
        vazamentos.forEach((re) => {
          expect(texto, `resposta NÃO deve vazar detalhe interno: ${re}`).to.not.match(re);
        });
      });
    });
  });
});
