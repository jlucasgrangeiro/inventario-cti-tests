declare namespace Cypress {
  interface Chainable {
    login(email?: string, password?: string): Chainable<void>;
    obterTombosDisponiveis(quantidade?: number): Chainable<string[]>;
  }
}
