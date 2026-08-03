export interface AtivoFormData {
  brand?: string;
  model?: string;
  serial?: string;
  tombo?: string;
  type?: string;
  acquisitionId?: string | number;
}

export class AtivosPage {
  visitLista(): void {
    cy.visit("/portal_service/listing_assets");
  }

  visitNovo(): void {
    cy.visit("/portal_service/listing_assets/new");
  }

  visitDeposito(): void {
    cy.visit("/portal_service/deposits");
  }

  preencher(dados: AtivoFormData): void {
    if (dados.brand !== undefined) cy.get("#asset_brand").clear().type(dados.brand || " ", { parseSpecialCharSequences: false });
    if (dados.model !== undefined) cy.get("#asset_model").clear().type(dados.model || " ", { parseSpecialCharSequences: false });
    if (dados.serial !== undefined) cy.get("#asset_serial").clear().type(dados.serial || " ", { parseSpecialCharSequences: false });
    if (dados.tombo !== undefined) cy.get("#asset_tombo").clear().type(dados.tombo || " ", { parseSpecialCharSequences: false });
    if (dados.type) cy.get("#type").select(dados.type);
    if (dados.acquisitionId !== undefined) cy.get("#asset_acquisition_id").select(String(dados.acquisitionId));
  }

  submit(): void {
    cy.get("form[action='/portal_service/listing_assets'][method='post'] input[type=submit][name=commit]").click();
  }
}

export const ativosPage = new AtivosPage();
