export type TipoColaborador = "Colaborador" | "Sem Colaborador" | "Subárea";
export type Modalidade = "Presencial" | "Home Office";

export interface AtribuicaoFormData {
  area: string;
  subarea: string;
  tipoColaborador?: TipoColaborador;
  colaborador?: string;
  modalidade: Modalidade;
  sistemaOperacional?: string;
  utilizaPacoteOffice?: boolean;
  observacoes?: string;
}

// base compartilhada com EditarAtribuicaoPage (mesmos ids/campos)
export class NovaAtribuicaoPage {
  // aceita um param opcional (ignorado aqui) só pra manter a assinatura compatível com o override em EditarAtribuicaoPage.visit(bondId)
  visit(_bondId?: string): void {
    cy.visit("/portal_service/bonds/new");
  }

  preencherFormulario(dados: AtribuicaoFormData): void {
    this.selecionarArea(dados.area);
    this.selecionarSubarea(dados.subarea);

    if (dados.tipoColaborador === "Sem Colaborador") {
      this.selecionarTipoColaborador("Sem Colaborador");
    } else if (dados.tipoColaborador === "Subárea") {
      this.selecionarTipoColaborador("Subárea");
    } else if (dados.colaborador) {
      this.selecionarColaborador(dados.colaborador);
    }

    this.selecionarModalidade(dados.modalidade);

    if (dados.sistemaOperacional) {
      this.selecionarSO(dados.sistemaOperacional);
    }

    if (dados.utilizaPacoteOffice) {
      this.marcarUtilizaPacoteOffice();
    }

    if (dados.observacoes) {
      cy.get("#bond_observation").type(dados.observacoes);
    }
  }

  selecionarArea(area: string): void {
    cy.get("#set_area").select(area);
  }

  selecionarSubarea(subarea: string): void {
    cy.get("#resp_subarea").select(subarea);
  }

  opcoesDeSubarea(): Cypress.Chainable<string[]> {
    return cy
      .get("#resp_subarea option")
      .then(($opts) => $opts.map((_, o) => Cypress.$(o).text().trim()).get().filter((t) => t !== ""));
  }

  selecionarTipoColaborador(tipo: TipoColaborador): void {
    const id =
      tipo === "Colaborador"
        ? "#bond_employee_type_colaborador"
        : tipo === "Sem Colaborador"
        ? "#bond_employee_type_sem_usuario"
        : "#bond_employee_type_subarea";
    cy.get(id).check({ force: true });
  }

  selecionarColaborador(colaborador: string): void {
    cy.get("#collaborators").select(colaborador, { force: true });
  }

  // "Atendido por" é opcional no cadastro, mas obrigatório (HTML5 required) na edição
  selecionarAtendidoPor(nomeOuIndiceUm = true): void {
    cy.get("#attended")
      .find("option")
      .its("length")
      .should("be.gte", 2);
    cy.get("#attended").then(($select) => {
      const valor =
        typeof nomeOuIndiceUm === "string"
          ? nomeOuIndiceUm
          : ($select.find("option").eq(1).val() as string);
      cy.wrap($select).select(valor, { force: true });
    });
  }

  selecionarModalidade(modalidade: Modalidade): void {
    const id = modalidade === "Presencial" ? "#bond_modality_presencial" : "#bond_modality_home_office";
    cy.get(id).check({ force: true });
  }

  selecionarSO(so: string): void {
    cy.get("#so").select(so, { force: true });
  }

  marcarUtilizaPacoteOffice(): void {
    cy.get("#check_office").check({ force: true });
  }

  // combo #key pode estar vazio no QA compartilhado (nenhuma licença cadastrada) — valida só a habilitação nesse caso
  selecionarPacoteOffice(pacote?: string): void {
    cy.get("#key").should("be.enabled");
    cy.get("#key").then(($select) => {
      const validas = $select.find("option").filter((_, o) => (o as HTMLOptionElement).value !== "");
      if (validas.length === 0) {
        cy.log("Nenhum Pacote Office cadastrado no ambiente — seleção ignorada (campo validado como habilitado)");
        return;
      }
      const valor = pacote ?? (validas.eq(0).val() as string);
      cy.wrap($select).select(valor, { force: true });
    });
  }

  desmarcarUtilizaPacoteOffice(): void {
    cy.get("#check_office").uncheck({ force: true });
  }

  pacoteOfficeFieldDeveEstarDesabilitado(): void {
    cy.get("#key").should("be.disabled");
  }

  pacoteOfficeFieldDeveEstarHabilitado(): void {
    cy.get("#key").should("be.enabled");
  }

  clickAtribuirAtivo(): void {
    cy.get("#btn_asset").click({ force: true });
  }

  atribuirAtivo(tombo: string): void {
    cy.get("#bond_asset").then(($el) => $el.find(".add_ativo").length).then((qtdAntes) => {
      this.clickAtribuirAtivo();
      // cocoon reusa os mesmos ids (set_tombo/set_status) em cada linha, então escopa à linha recém-criada
      cy.get("#bond_asset .add_ativo").eq(qtdAntes as number).as("novaLinhaAtivo");

      cy.get("@novaLinhaAtivo").find("select.select_tombo").select(tombo, { force: true });

      cy.get("@novaLinhaAtivo").find("select#set_description").find("option").its("length").should("be.gte", 1);
      cy.get("@novaLinhaAtivo")
        .find("select#set_description")
        .then(($select) => {
          const options = $select.find("option");
          if (options.length > 0) {
            cy.wrap($select).select(options.eq(0).val() as string, { force: true });
          }
        });

      cy.get("@novaLinhaAtivo").find("select#set_status").find("option").its("length").should("be.gte", 2);
      cy.get("@novaLinhaAtivo")
        .find("select#set_status")
        .then(($select) => {
          const valor = $select.find("option").eq(1).val() as string;
          cy.wrap($select).select(valor, { force: true }).should("have.value", valor);
        });
    });
  }

  ativosDaAtribuicao(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get("#bond_asset");
  }

  clickSalvar(): void {
    cy.get("input[type=submit][name=commit]").click();
  }

  // tenta os candidatos em sequência até um ser aceito (nem todo "DISPONÍVEL" do depósito realmente está livre)
  salvarComPrimeiroAtivoAceito(tombosCandidatos: string[]): void {
    const tentar = (index: number): void => {
      if (index >= tombosCandidatos.length) {
        throw new Error("Nenhum dos tombos candidatos foi aceito pelo servidor.");
      }
      this.atribuirAtivo(tombosCandidatos[index]);
      this.clickSalvar();
      cy.get("body").then(($body) => {
        if ($body.text().includes("já está vinculado")) {
          cy.get("#bond_asset .add_ativo").last().find("a.remove_fields").click({ force: true });
          tentar(index + 1);
        }
      });
    };
    tentar(0);
  }

  clickCancelar(): void {
    cy.contains("button", "Cancelar").click();
  }

  campoDeveEstarInvalido(selector: string): void {
    cy.get(selector).then(($el) => {
      expect(($el[0] as HTMLInputElement | HTMLSelectElement).validity.valid).to.eq(false);
    });
  }
}

export const novaAtribuicaoPage = new NovaAtribuicaoPage();
