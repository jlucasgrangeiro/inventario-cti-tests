export class AreasPage {
  visitLista(): void {
    cy.visit("/portal_service/areas");
  }

  preencher(descricao: string): void {
    cy.get("#area_description").clear().type(descricao, { parseSpecialCharSequences: false });
  }

  submit(): void {
    cy.get("form[action='/portal_service/areas'][method='post'] input[type=submit][name=commit]").click();
  }

  cadastrar(descricao: string): void {
    this.visitLista();
    this.preencher(descricao);
    this.submit();
  }
}

export class SubareasPage {
  visitLista(): void {
    cy.visit("/portal_service/subareas");
  }

  preencher(descricao: string, areaOpcao?: string | number): void {
    cy.get("#subarea_description").clear().type(descricao, { parseSpecialCharSequences: false });
    if (areaOpcao !== undefined) {
      cy.get("#subarea_area_id").select(String(areaOpcao));
    }
  }

  submit(): void {
    cy.get("form[action='/portal_service/subareas'][method='post'] input[type=submit][name=commit]").click();
  }

  cadastrar(descricao: string, areaOpcao: string | number): void {
    this.visitLista();
    this.preencher(descricao, areaOpcao);
    this.submit();
  }
}

export const areasPage = new AreasPage();
export const subareasPage = new SubareasPage();
