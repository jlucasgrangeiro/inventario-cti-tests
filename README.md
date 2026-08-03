# Inventário CTI — Suíte de Testes Automatizados (Cypress + TypeScript)

Testes end-to-end para o sistema **Inventário CTI**, da Procuradoria-Geral do Estado do
Ceará (PGE-CE)

> **Status:** suíte completa, validada de ponta a ponta contra o ambiente
> real (http://testeqa.pge.ce.gov.br). Execução de referência: **85/85
> testes passando** em 11 specs (100%) — as 5 histórias de usuário do
> desafio mais 6 sessões exploratórias de segurança/UX. 23 defeitos e 1
> divergência de especificação foram encontrados e documentados — ver
> [Achados](#achados-bugs-e-divergência-de-especificação).

**Estrutura do projeto**,
**plano de teste e documentação**, **implementação dos testes** e
**evidências/relatórios com proposta de melhorias**.

| Frente de avaliação | Onde está nesta entrega |
|---|---|
| Estrutura e organização do projeto | Page Object Model em `cypress/pages/`, specs por história de usuário em `cypress/e2e/`, comandos/utilitários em `cypress/support/` — ver [Estrutura](#estrutura-do-projeto) |
| Plano de teste e documentação | [`docs/plano-de-teste.md`](docs/plano-de-teste.md) — escopo, estratégia, critérios de entrada/saída, riscos e cenários |
| Implementação dos testes automatizados | 85 testes nas 11 specs de `cypress/e2e/` (5 histórias de usuário + 6 sessões exploratórias), todos validados contra o ambiente real |
| Evidências e relatórios / melhorias propostas | [`docs/evidencias/`](docs/evidencias/) (relatório HTML + vídeos) e [`docs/bugs-encontrados.md`](docs/bugs-encontrados.md) (defeitos, com melhorias sugeridas para cada um) |

## Stack

- [Cypress](https://www.cypress.io/) 13.x + TypeScript
- `pdf-parse` (via `cy.task`) para validar conteúdo dos PDFs gerados
  (Termos de Responsabilidade/Empréstimo e Relatórios)
- `mochawesome` + `mochawesome-merge` para relatório de execução consolidado

## Estrutura do projeto

```
cypress/
├── e2e/
│   ├── 01-05                # as 5 histórias de usuário do desafio
│   └── 06-11                # sessões exploratórias (login, colaboradores, áreas, ativos, UX, aprofundamento)
├── pages/                   # Page Objects — uma classe por tela/modal
├── support/
│   ├── commands.ts          # cy.login(), cy.obterTombosDisponiveis()
│   ├── setup.ts             # criarAtribuicaoDeTeste() — setup via UI (não há API de massa de dados)
│   └── testData.ts          # observacaoDeTeste() — texto legível descrevendo o cenário testado
├── fixtures/                 # massa de dados estática
├── tasks/                   # tasks Node (leitura de texto de PDF via pdf-parse)
docs/
├── plano-de-teste.md        # escopo, estratégia, critérios, riscos, cenários
├── bugs-encontrados.md      # 23 defeitos encontrados (passos, evidência, melhoria sugerida)
└── evidencias/
    ├── relatorio-execucao.html + vídeos por spec
    └── bugs/                 # print de 18 dos 23 defeitos documentados
```

Cada Page Object expõe apenas o que a tela real oferece (seletores por
`id`/`name`, já que a aplicação — Rails + jQuery + Bootstrap + Select2 —
não tem atributos `data-cy`/`data-testid`); as specs descrevem o
comportamento esperado em português, separadas em `context("Casos
positivos")` / `context("Casos negativos")`.

## Pré-requisitos

- Node.js 18+
- npm
- Git (para clonar/versionar o repositório)

## Instalação

```bash
npm install
npx cypress install   # garante o binário do Cypress baixado/verificado
```

## Configuração de credenciais

As credenciais de acesso **não são versionadas**.

```bash
cp cypress.env.json.example cypress.env.json
```

```json
{
  "USER_EMAIL": "qa.teste@teste.pge.ce.gov.br",
  "USER_PASSWORD": "<senha fornecida no desafio>"
}
```

Alternativamente, use variáveis de ambiente com o prefixo `CYPRESS_`
(mesmo mecanismo usado no workflow de CI):

```bash
CYPRESS_USER_EMAIL=... CYPRESS_USER_PASSWORD=... npm run cy:run
```

## Executando os testes

Modo interativo (Test Runner):

```bash
npm run cy:open
```

Modo headless (linha de comando, gera vídeo e relatório):

```bash
npm run cy:run
```

Executar apenas uma história de usuário ou sessão exploratória:

```bash
npm run test:us01   # Cadastro de Atribuições
npm run test:us02   # Editar Atribuições
npm run test:us03   # Geração de Termos
npm run test:us04   # Relatório de Movimentação de Ativos
npm run test:us05   # Relatório de Atribuições por Área

npm run test:exploratorio:login
npm run test:exploratorio:usuarios
npm run test:exploratorio:areas
npm run test:exploratorio:transversal
npm run test:exploratorio:ativos
npm run test:exploratorio:aprofundamento
```

## Relatórios e evidências

- Relatório HTML consolidado (mochawesome) da execução de referência desta
  entrega — 85/85 testes, 100%:
  [`docs/evidencias/relatorio-execucao.html`](docs/evidencias/relatorio-execucao.html)
- Vídeo de cada execução, um por spec:
  `docs/evidencias/<pasta-da-spec>/<spec>.cy.ts.mp4`
- A cada `npm run cy:run` local, novos relatórios/vídeos são gerados em
  `report/report.html`, `cypress/videos/` e (em caso de falha)
  `cypress/screenshots/`.

## Documentação

- **[Plano de Teste](docs/plano-de-teste.md)** — escopo, estratégia de
  automação (engenharia reversa da aplicação, massa de dados, validação de
  PDF), critérios de entrada/saída, riscos e a tabela completa de cenários
  por história de usuário.
- **[Bugs Encontrados](docs/bugs-encontrados.md)** — defeitos encontrados
  durante a automação e testes exploratórios manuais, no formato de
  relatório de bug (passos para reproduzir, resultado esperado vs. obtido,
  severidade, evidência e melhoria sugerida para cada um).

## CI

O workflow [`.github/workflows/cypress.yml`](.github/workflows/cypress.yml)
executa a suíte a cada push/PR para `main`, publicando vídeos, screenshots
de falha e o relatório mochawesome como artefatos. As credenciais são lidas
de secrets do repositório (`CYPRESS_USER_EMAIL`, `CYPRESS_USER_PASSWORD`).

## Achados: bugs e divergência de especificação

23 bugs foram encontrados e documentados em
[`docs/bugs-encontrados.md`](docs/bugs-encontrados.md) (passos para
reproduzir, causa raiz, severidade, print e evidência de cada um — 18 deles
com screenshot em [`docs/evidencias/bugs/`](docs/evidencias/bugs/)). Os que
afetam diretamente as 5 histórias de usuário do desafio:

| ID | Achado | Severidade |
|---|---|---|
| BUG-01 | Campo "Colaborador" continua obrigatório e vazio nos modos "Sem Colaborador"/"Subárea" da Nova Atribuição, impedindo salvar | Alta |
| BUG-02 | Ícone "X" (e tecla Esc) não fecham o modal "Gerar Termos" — `data-dismiss` sem prefixo `bs-`, incompatível com o Bootstrap 5 usado pela aplicação | Baixa/Média |
| BUG-03 | Status "DISPONÍVEL" no Depósito CTI nem sempre condiz com a disponibilidade real do ativo para vínculo (20% de falha em amostra manual) | Média |
| BUG-04 | Validação de Subárea intermitente — ora salva sem subárea, ora bloqueia | Alta |
| BUG-05 | Permite salvar atribuição sem Modalidade de trabalho | Média/Alta |
| BUG-06 | Combo Subárea não é filtrado pela Área selecionada | Média |
| BUG-07 | PDF de Movimentação de Ativos abre na mesma aba (sem `target="_blank"`) | Baixa |

Os BUG-08 a BUG-21 vieram das sessões exploratórias — validação ausente no
login e nos cadastros de Colaboradores/Áreas/Ativos, alguns provocando
HTTP 500 com campos muito longos. BUG-22 e BUG-23 são achados adicionais
das próprias US03/US04 (gerar termo sem seleção; período invertido não
validado). A **US05 não corresponde à
tela real** (o desafio descreve o mesmo relatório da US04, mas a tela
implementada é um painel de conformidade por área) — divergência de
especificação, não um bug; detalhada em
[`docs/plano-de-teste.md`, seção 6.1](docs/plano-de-teste.md#61-us05-não-corresponde-à-tela-real-achado-de-especificação).

Vários testes estão marcados com o prefixo `[BUG]` ou `[ACHADO]` no título
e validam o comportamento **real** observado — funcionam como regressores:
se corrigidos, passam a falhar, sinalizando que a asserção precisa ser
atualizada.
