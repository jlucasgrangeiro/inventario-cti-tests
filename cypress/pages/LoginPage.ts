export class LoginPage {
  visit(): void {
    cy.visit("/");
  }

  emailField(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("#admin_email");
  }

  passwordField(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("#admin_password");
  }

  submitButton(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("input[type=submit][name=commit]");
  }

  preencher(email: string, senha: string): void {
    this.emailField().clear().type(email);
    this.passwordField().clear().type(senha, { log: false });
  }

  submit(): void {
    this.submitButton().click();
  }

  tentar(email: string, senha: string): void {
    this.preencher(email, senha);
    this.submit();
  }
}

export const loginPage = new LoginPage();
