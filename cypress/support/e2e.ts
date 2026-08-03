import "./commands";

// evita que erros não tratados da app derrubem a suíte inteira
Cypress.on("uncaught:exception", (err) => {
  // eslint-disable-next-line no-console
  console.error("[uncaught:exception]", err.message);
  return false;
});
