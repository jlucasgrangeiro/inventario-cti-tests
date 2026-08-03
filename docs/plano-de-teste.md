# Plano de Teste — Inventário CTI

**Projeto:** Desafio de Automação de Testes — Sistema Inventário CTI (PGE-CE)
**Ambiente sob teste:** http://testeqa.pge.ce.gov.br
**Ferramenta de automação:** Cypress 13 + TypeScript
**Autor:** Joao Lucas

---

## 1. Escopo

### 1.1 Em escopo

Automação end-to-end, via UI (e chamadas HTTP autenticadas para validação de
PDFs gerados), das 5 histórias de usuário do desafio:

| # | História de Usuário | Fluxo no sistema | Spec |
|---|---|---|---|
| US01 | Cadastro de Atribuições | Atribuições → Nova Atribuição → Novo Ativo | `cypress/e2e/01-cadastro-atribuicoes` |
| US02 | Editar Atribuições | Atribuições → Ações → Editar | `cypress/e2e/02-editar-atribuicoes` |
| US03 | Geração de Termos | Atribuições → checkbox → Gerar Termos | `cypress/e2e/03-geracao-termos` |
| US04 | Relatório de Movimentação de Ativos | Relatórios → Movimentação de Ativos | `cypress/e2e/04-relatorio-movimentacao` |
| US05 | Relatório de Atribuições por Área | Relatórios → Atribuições por Área | `cypress/e2e/05-relatorio-atribuicoes-area` |

Cobertura por história: casos positivos (fluxo feliz, variações de campos
opcionais/condicionais) e casos negativos (validação de campos obrigatórios,
ausência de dados, ações bloqueadas). Onde a aplicação real diverge do
documento do desafio ou apresenta defeito, o comportamento **real** é o que
foi automatizado e o desvio é documentado (seção 6).

---

## 2. Estratégia e abordagem

### 2.1 Modelo de testes

- **Page Object Model** (`cypress/pages/*.ts`): cada tela/modal da aplicação
  vira uma classe com métodos de ação (`selecionarArea`, `clickSalvar`, ...)
  e de asserção. As specs descrevem *o que* é validado; os Page Objects
  encapsulam *como* interagir com o DOM real.
- **Specs por história de usuário**, uma pasta por US, com `context("Casos
  positivos")` / `context("Casos negativos")` dentro de cada `describe`.
- **Comandos customizados** (`cypress/support/commands.ts`):
  - `cy.login()` — autentica via UI e reaproveita a sessão com `cy.session`
    (evita logar a cada teste).
  - `cy.obterTombosDisponiveis()` — ver seção 2.3.
- **Tasks Node** (`cypress/tasks/pdf.tasks.ts`) — o Cypress roda no
  navegador e não consegue interpretar PDF nativamente; uma task Node usa
  `pdf-parse` para extrair texto de PDFs baixados/buscados e permitir
  asserções de conteúdo (US03 e US04).


### 2.2 Ferramentas

| Ferramenta | Uso |
|---|---|
| Cypress 13 (TypeScript) | Framework de automação E2E |
| `pdf-parse` (via `cy.task`) | Extração de texto de PDFs gerados |
| `mochawesome` + `mochawesome-merge` | Relatório HTML consolidado da execução |
| `cypress-multi-reporters` | Integra mochawesome ao runner |
| GitHub Actions (`.github/workflows/cypress.yml`) | Execução em CI a cada push/PR |
| Electron (headless, embutido no Cypress) | Browser de execução (ver seção 5) |

---

## 3. Critérios de entrada

- Ambiente `http://testeqa.pge.ce.gov.br` acessível e credenciais válidas
  configuradas em `cypress.env.json` (não versionado; ver `README.md`).
- Dependências instaladas (`npm install`) e binário do Cypress instalado
  (`npx cypress install`, se necessário).
- Existência de ao menos: uma Área/Subárea/Colaborador de teste
  cadastrados (o ambiente já provê Área "Teste", Subárea "Teste" e
  Colaborador "Teste" para esse fim) e ativos com status DISPONÍVEL no
  Depósito CTI.

## 4. Critérios de saída

- Todos os cenários planejados implementados (positivos e negativos) para
  as 5 histórias de usuário, mais 6 sessões exploratórias complementares.
- 100% dos testes passando na execução de referência desta entrega:
  **85/85 testes, 11 specs, 0 falhas** (relatório em
  `docs/evidencias/relatorio-execucao.html`; vídeos por spec em
  `docs/evidencias/<pasta-da-spec>/`).
- Defeitos e divergências de especificação encontrados documentados
  (seção 6) — a suíte permanece verde propositalmente ao validar o
  comportamento *real* observado, funcionando como um regressor: se o
  defeito for corrigido, o teste correspondente (marcado `[BUG]`) passa a
  falhar e sinaliza que a asserção precisa ser atualizada para o novo
  comportamento esperado.
- Nenhuma credencial ou dado sensível commitado no repositório
  (`cypress.env.json` está no `.gitignore`).

---

### 5. Defeitos encontrados (bugs)

23 defeitos foram encontrados ao longo da automação das 5 USs e das sessões
exploratórias (seção 8) — passos para reproduzir, causa raiz, severidade e
evidência de cada um estão em **[docs/bugs-encontrados.md](bugs-encontrados.md)**.
Os mais relevantes para as 5 histórias de usuário do desafio:

| ID | Título | Severidade |
|---|---|---|
| BUG-01 | Campo "Colaborador" continua obrigatório e vazio nos modos "Sem Colaborador"/"Subárea" (US01) | Alta |
| BUG-02 | Ícone "X" (e tecla Esc) não fecham o modal "Gerar Termos" (US03) | Baixa/Média |
| BUG-03 | Status "DISPONÍVEL" no Depósito CTI nem sempre reflete disponibilidade real para vínculo | Média |
| BUG-04 | Validação de Subárea intermitente — ora salva sem subárea, ora bloqueia (US01) | Alta |
| BUG-05 | Permite salvar atribuição sem Modalidade (US01) | Média/Alta |
| BUG-06 | Combo Subárea não é filtrado pela Área selecionada (US01) | Média |
| BUG-07 | PDF de Movimentação abre na mesma aba, sem `target="_blank"` (US04) | Baixa |
| BUG-22 | Permite gerar termo sem nenhuma atribuição selecionada (US03) | Baixa/Média |
| BUG-23 | Filtro de período de Movimentação não valida data final < inicial (US04) | Baixa |

Vários têm teste automatizado correspondente (marcado `[BUG]` no título) que
valida o comportamento real como regressor — ver seção 7. O BUG-03 foi
confirmado por amostragem manual (5 tentativas, 1 falha) e é a motivação por
trás da estratégia de retentativa descrita na seção 2.3.

---

## 6. Cenários de teste

Cada cenário abaixo corresponde a um `it(...)` implementado e executado
(nomes conforme a suíte real). Detalhes de passos ficam nos próprios
specs/Page Objects, comentados em português.

### US01 — Cadastro de Atribuições (`01-cadastro-atribuicoes.cy.ts`)

| Tipo | Cenário |
|---|---|
| Positivo | Cadastrar atribuição com colaborador específico, ativo vinculado, SO e observações |
| Positivo | Cadastrar atribuição em Home Office com SO e Pacote Office e verificar persistência (reabrindo em edição) |
| Achado documentado | `[ACHADO]` combo Subárea é populado mas NÃO é filtrado pela Área selecionada (BUG-06) |
| Positivo | Habilitar campo Pacote Office somente com a checkbox marcada |
| Positivo | Vincular múltiplos ativos à mesma atribuição |
| Positivo | Cancelar descarta informações não salvas |
| Defeito documentado | `[BUG]` "Sem Colaborador"/"Subárea" — ver 6.2 |
| Negativo | Bloquear salvar sem nenhum campo obrigatório preenchido |
| Negativo | Bloquear salvar sem selecionar Área |
| Defeito documentado | `[BUG]` validação de Subárea intermitente — ora salva sem subárea, ora bloqueia (BUG-04) |
| Defeito documentado | `[BUG]` permite salvar sem Modalidade — campo com * não é validado (BUG-05) |
| Negativo | Bloquear salvar sem vincular ao menos um ativo (`"Ativo não informado!"`) |

### US02 — Editar Atribuições (`02-editar-atribuicoes.cy.ts`)

| Tipo | Cenário |
|---|---|
| Positivo | Carregar todos os campos preenchidos anteriormente ao abrir para edição |
| Positivo | Exibir seção "Ativos da Atribuição" com tombo, descrição e status |
| Positivo | Cancelar descarta alterações não salvas |
| Positivo | Modificar modalidade e manter integridade dos dados após salvar |
| Positivo | Adicionar um novo ativo à atribuição existente |
| Positivo | Fluxo de substituição (marcar DISPONÍVEL, remover, adicionar novo ativo) |
| Positivo | Fluxo de defeito (marcar COM DEFEITO, informar o defeito, remover, adicionar novo ativo) |
| Positivo | Editar Observações e persistir o novo texto |
| Positivo | Trocar o Colaborador responsável (quando houver outro disponível na área) |
| Negativo | Bloquear salvar removendo um campo obrigatório (Área) |
| Negativo | Bloquear salvar sem nenhum ativo vinculado |

### US03 — Geração de Termos (`03-geracao-termos.cy.ts`)

| Tipo | Cenário |
|---|---|
| Positivo | Seleção mutuamente exclusiva entre Responsabilidade/Empréstimo |
| Positivo (defeito documentado) | `[BUG]` ícone X não fecha o modal — ver 6.2 |
| Positivo | Gerar PDF de Termo de Responsabilidade com todo o conteúdo obrigatório (incl. dados reais do vínculo: colaborador/área) |
| Positivo | Gerar termo único para múltiplas atribuições selecionadas (URL de nova aba via `window.open` contém ambos os ids) |
| Positivo | Gerar PDF de Termo de Empréstimo com todo o conteúdo obrigatório |
| Negativo | Bloquear geração sem selecionar um tipo de termo (alerta do navegador) |
| Negativo (achado documentado) | `[ACHADO]` permite gerar termo sem nenhuma atribuição selecionada (`bonds_ids` vazio) (BUG-22) |

### US04 — Relatório de Movimentação de Ativos (`04-relatorio-movimentacao.cy.ts`)

| Tipo | Cenário |
|---|---|
| Positivo | Filtrar por Área e Período e atualizar listagem ao Pesquisar |
| Positivo | Agrupar resultados por área com cabeçalho de data (formato por extenso "21 de Janeiro de 2026") e quantidade |
| Positivo | Filtrar apenas por Área (sem período) |
| Positivo | Filtrar apenas por Período (sem área) |
| Positivo | Exibir Tombo, Nº de Série, Descrição, Lotação Anterior/Atual e Colaborador |
| Positivo | Gerar PDF respeitando o agrupamento por área e data |
| Defeito documentado | `[BUG]` "Gerar Relatório" abre o PDF na MESMA aba (sem `target="_blank"`), contrariando o critério |
| Negativo | Informar "Sem movimentações para: X" quando não há dados no período/área |
| Negativo (achado documentado) | Período invertido (data final anterior à inicial) retorna listagem vazia em vez de validar o intervalo (BUG-23) |

### US05 — Relatório de Atribuições por Área (`05-relatorio-atribuicoes-area.cy.ts`)

> Ver achado de especificação na seção 6.1 — cenários validam o
> comportamento real da tela.

| Tipo | Cenário |
|---|---|
| Positivo | Modo Sintético: filtrar por Área e exibir total de atribuições e indicadores |
| Positivo | Modo Analítico: listar atribuições da área agrupadas por colaborador |
| Positivo | Filtrar também por Subárea |
| Positivo | Gerar PDF do relatório após pesquisar (com validação do conteúdo textual do PDF) |
| Negativo | Bloquear geração sem escolher Sintético ou Analítico (Tipo obrigatório) |

---

## 8. Testes exploratórios (session-based)

Complementam a automação com sessões manuais (SBTM — session-based test
management) focadas em áreas não cobertas pelas 5 USs, transversais de UX,
segurança observacional e aprofundamento dos bugs já mapeados.

**Evidências**: `docs/evidencias/exploratorios/<sessao>/<ID>-descricao.png|mp4`.
Bugs novos encontrados aqui devem ser registrados em `docs/bugs-encontrados.md`
seguindo o padrão BUG-08, BUG-09...

### Sessão 1 — Login (segurança observacional)

> **AUTOMATIZADO PARCIALMENTE**: 10 dos 13 cenários foram automatizados em
> [`cypress/e2e/06-login-exploratorio/login-exploratorio.cy.ts`](../cypress/e2e/06-login-exploratorio/login-exploratorio.cy.ts)
> (executar com `npm run test:exploratorio:login`). L09, L10 e L12 devem
> ser feitos manualmente. Achados registrados: **BUG-08, BUG-09, BUG-10**.

| ID | Cenário | Passos | Resultado esperado | Observado |
|---|---|---|---|---|
| L01 | E-mail inexistente | Entrar com `naoexiste@teste.com` + senha qualquer | Mensagem genérica ("credenciais inválidas"), sem revelar que o usuário não existe | ✅ Automatizado — mensagens idênticas |
| L02 | Senha errada para usuário válido | E-mail válido + senha errada | Mesma mensagem do L01 (diferença = enumeração) | ✅ Automatizado — sem enumeração |
| L03 | Campos vazios | Clicar Entrar sem preencher nada | Validação bloqueia (front + backend) | ⚠️ **BUG-08**: `#admin_email` sem `required` |
| L04 | E-mail malformado | `qa.teste` / `qa@` / `@teste.com` | Validação de formato bloqueia | ✅ Automatizado — `type=email` valida |
| L05 | Senha visível no DOM | Inspecionar campo (F12) | `type="password"`; opcional: botão "mostrar senha" | ✅ Automatizado — OK |
| L06 | Autocomplete de senha | Inspecionar `<input>` de senha | `autocomplete="current-password"` ou `"off"` | ⚠️ **BUG-09**: atributo ausente |
| L07 | Sessão após logout — botão voltar | Login → navegar → logout → botão voltar do navegador | Redireciona ao login; nenhum dado sensível reaparece | ⚠️ **BUG-10**: página interna reexposta |
| L08 | Acesso direto deslogado | Sem login, colar URL interna (ex.: `/portal_service/bonds`) | Redireciona ao login | ✅ Automatizado — 302 para /admins/sign_in |
| L09 | Múltiplos logins simultâneos | Logar em 2 navegadores/anônimas com mesmo usuário | Comportamento definido (permite ou invalida a anterior) | 📝 Manual |
| L10 | Timeout de sessão | Deixar 30–60 min ocioso e tentar ação | Sessão expira com mensagem clara | 📝 Manual |
| L11 | Headers HTTP de segurança | F12 → Network → response headers | Presença de `X-Frame-Options`, `CSP`, `HSTS`, `X-Content-Type-Options` | ✅ Automatizado — loga cobertura real |
| L12 | Enumeração no "esqueci senha" (se existir) | Solicitar reset com e-mail válido e inválido | Mensagens/tempos idênticos | 📝 Manual |
| L13 | Caractere `'` no campo e-mail (passivo) | Digitar `a'@teste.com` + senha qualquer | Mensagem genérica; **alerta** se aparecer erro de banco (`PG::`, `ActiveRecord`, `SQL syntax`) — indica falta de sanitização | ✅ Automatizado — sem vazamento |

### Sessão 2 — Cadastro de Usuários/Colaboradores

> **Status:** AUTOMATIZADO (8 cenários em
> `cypress/e2e/07-usuarios-exploratorio/usuarios-exploratorio.cy.ts`).
> Rota real: `/portal_service/users` (modelo `User`, rotulado como
> "Colaboradores" na UI). Formulário mínimo: apenas **Nome**
> (`#user_name`, `required`) e **E-mail** (`#user_email`, `type="text"`,
> não obrigatório). Não existe campo de CPF — por isso U02/U03 do
> plano original **não se aplicam** e foram marcados como N/A.
> Adotamos ainda uma restrição operacional: **não inativamos
> colaboradores em runs automatizados** para não interferir com outros
> testadores da mesma base (não há endpoint público de reativação).
> U07 foi convertido em validação **não destrutiva** da estrutura de
> inativação (data-method=delete + data-confirm + tooltip "Inativar").

| ID | Cenário | Passos | Resultado esperado | Observado |
|---|---|---|---|---|
| U01 | E-mail duplicado | Cadastrar 2 usuários com mesmo e-mail | Bloqueio com mensagem clara | ✅ Automatizado — teste tolera 2 comportamentos e loga [ACHADO] BUG-13 quando a duplicidade é aceita |
| U02 | CPF inválido | — | — | N/A — formulário não possui campo CPF |
| U03 | CPF duplicado | — | — | N/A — formulário não possui campo CPF |
| U04 | Nome com acentos e espaços múltiplos | Cadastrar `Joao   das   NevesAc<TS>` | Aceita acentos; faz trim | ✅ Automatizado — sistema **preserva** espaços múltiplos (achado de UX potencial, registrado em log) |
| U05 | Nome com HTML/tags (XSS passivo) | Cadastrar `<b>xss<TS></b><script>window.__xss=1</script>` | Nome literal na listagem; `__xss` fica `undefined` | ✅ Automatizado — Rails escapa via ERB, sem XSS |
| U06 | Nome no limite de tamanho | Preencher com 300 caracteres | Erro amigável (não 5xx) | ❌ **BUG-14** — servidor retorna **HTTP 500** |
| U07 | Excluir/Inativar colaborador | Verificar estrutura do botão (não executar) | Botão existe, aponta para DELETE, exige confirm, tooltip "Inativar" (soft-delete) | ✅ Automatizado (não-destrutivo) |
| U08 | Campo E-mail no formulário | Inspecionar `#user_email` | `type="email"` | ❌ **BUG-11** — `type="text"` |
| U09 | E-mail em branco | Cadastrar só com nome | Bloqueio | ❌ **BUG-12** — cadastro aceito sem e-mail |

### Sessão 3 — Depósito CTI / Ativos

> **Status:** AUTOMATIZADO (6 cenários em
> `cypress/e2e/10-ativos-exploratorio/ativos-exploratorio.cy.ts`).
> Rotas reais: `/portal_service/listing_assets` (CRUD) e
> `/portal_service/deposits` (Depósito CTI). Descoberta central: **o
> formulário de Novo Ativo não tem nenhum `required`** — nem HTML5,
> nem, aparentemente, validação server-side confiável. Isso gera
> ativos "fantasma".

| ID | Cenário | Passos | Resultado esperado | Observado |
|---|---|---|---|---|
| A00 | Campos obrigatórios | Verificar `required` em todos inputs/selects | Ao menos tombo/tipo/aquisição obrigatórios | ❌ **BUG-18** — nenhum tem `required` |
| A01 | Submit vazio | Enviar form sem preencher | Erro amigável de validação | ❌ **BUG-19** — backend aceita |
| A02 | Tombo duplicado | Cadastrar 2 ativos com mesmo tombo | Bloqueio de unicidade | ❌ **BUG-20** — duplicidade aceita |
| A03 | XSS passivo (marca/modelo) | Cadastrar `<b>xssA<TS></b><script>...` em brand | Escapar; sem execução JS | ✅ Automatizado |
| A04 | Tombo com 300 chars | Cadastrar tombo gigante | Erro amigável, não 5xx | ⚠️ **BUG-21** potencial (logado) |
| A05 | Depósito CTI carrega | GET `/portal_service/deposits` + filtro por status | Página funcional | ✅ Automatizado |

### Sessão 4 — Áreas e Subáreas

> **Status:** AUTOMATIZADO (7 cenários em
> `cypress/e2e/08-areas-exploratorio/areas-exploratorio.cy.ts`).
> Rotas reais: `/portal_service/areas` e `/portal_service/subareas`.
> Formulários mapeados: **Área** = `#area_description` (`required`);
> **Subárea** = `#subarea_description` + `#subarea_area_id` (`required`,
> select da área pai). Mesma restrição operacional das outras sessões:
> **não executamos exclusão real** — hard/soft-delete é ambíguo (ver
> BUG-16) e não há endpoint público de reativação.

| ID | Cenário | Passos | Resultado esperado | Observado |
|---|---|---|---|---|
| AR01 | Área duplicada | Cadastrar 2 áreas com mesma descrição | Bloqueio | ❌ **BUG-15** — permite duplicidade |
| AR02 | Estrutura do botão "excluir" | Verificar `data-method=delete` + `data-confirm` | Botão apresente e com confirm | ✅ Automatizado (não-destrutivo) |
| AR03 | Subárea exige área pai | Verificar `required` no `<select>` | HTML5 required | ✅ Automatizado |
| AR04 | Descrição de área obrigatória | Submit sem descrição | HTML5 bloqueia | ✅ Automatizado |
| AR05 | XSS passivo na descrição | Cadastrar `<b>xssA<TS></b><script>...` | Rails escapa; `__xssArea` = undefined | ✅ Automatizado |
| AR06 | Consistência UX de "excluir" | Comparar tooltip × data-confirm | Devem coincidir | ❌ **BUG-16** — tooltip "Excluir" × confirm "Ativar/Desativar" |
| AR07 | Descrição com 300 chars | Cadastrar área com 300 chars | Erro amigável (não 5xx) | ⚠️ **BUG-17** potencial — teste loga achado se resposta ≥ 500 |

### Sessão 5 — Transversal / UX

> **Status:** AUTOMATIZADO PARCIALMENTE (6 cenários em
> `cypress/e2e/09-transversal-exploratorio/transversal-exploratorio.cy.ts`).
> T02 (navegação por teclado) e T03 (responsividade visual) permanecem
> manuais — dependem de verificação sensorial. T06 foi adaptado para
> checar idempotência da listagem de vínculos em vez do PDF (rota
> específica de termo pode variar; a preservação semântica é a
> mesma).

| ID | Cenário | Passos | Resultado esperado | Observado |
|---|---|---|---|---|
| T01 | Duplo clique em Salvar | Duplo-clique em "Criar" colaborador | `data-disable-with` ativo; 1 registro só | ✅ Automatizado |
| T02 | Navegação por teclado | Percorrer com Tab/Shift+Tab/Enter | Ordem lógica; foco sempre visível | Manual |
| T03 | Responsividade | Redimensionar / zoom 200% | Layout não quebra | Manual |
| T04 | Botão voltar após salvar | Salvar → voltar do navegador | Sem reenvio silencioso do POST | ✅ Automatizado (PRG) |
| T05 | URL protegida sem sessão | GET `/portal_service/bonds` sem cookie | Redireciona ao `/admins/sign_in` | ✅ Automatizado |
| T06 | Idempotência de leitura | GET `/portal_service/bonds` 2x | Status e tamanho de resposta consistentes | ✅ Automatizado |
| T07 | Meta CSRF presente | Verificar meta na home autenticada | `csrf-token` e `csrf-param` presentes | ✅ Automatizado |
| T08 | Sidebar sem links quebrados | Percorrer todos os hrefs da sidebar | Todos respondem < 400 | ✅ Automatizado |

### Sessão 6 — Aprofundar bugs já mapeados

> **Status:** AUTOMATIZADO (5 cenários em
> `cypress/e2e/11-bugs-aprofundamento/bugs-aprofundamento.cy.ts`).
> Foco em **consequências** dos BUG-04..10 já documentados. Todos
> são não destrutivos: consultam endpoint ou HTML, sem criar/apagar
> registros críticos.

| ID | Cenário | Passos | Resultado esperado | Observado |
|---|---|---|---|---|
| B01 | Impacto do BUG-04 na listagem | GET `/portal_service/bonds` | Nenhum registro com subárea vazia | Loga contagem observada |
| B02 | Reconfirmar BUG-05 (modalidade sem `required`) | Inspecionar form de nova atribuição | `required` presente | Loga [ACHADO] se ausente |
| B03 | Termo com `bonds_ids` vazio | POST `/portal_service/bonds/generate_terms` sem seleção | 4xx amigável ou redirect com flash | ✅ Automatizado (não deve 5xx) |
| B04 | BUG-06 na prática | Contar `<option>` do select de Subárea sem filtro | Combo deveria filtrar por área | Loga [ACHADO] se > 3 opções |
| B05 | Cache-Control ausente (BUG-10) | Inspecionar header em `/home/index` | `Cache-Control: no-store` ou similar | Loga [ACHADO] se ausente |

---

## 7. Evidências

- Relatório HTML consolidado (mochawesome) da execução de referência:
  [`docs/evidencias/relatorio-execucao.html`](evidencias/relatorio-execucao.html)
  — 85/85 testes, 11 specs, 100% de sucesso.
- Vídeos de cada execução, um por spec:
  `docs/evidencias/<pasta-da-spec>/<spec>.cy.ts.mp4`.
- Prints dos defeitos encontrados: `docs/evidencias/bugs/BUG-XX-*.png` —
  18 dos 23 bugs documentados têm print capturado via `cy.screenshot()` no
  próprio teste que os demonstra (ver tabela em
  [`docs/bugs-encontrados.md`](bugs-encontrados.md#resumo)).
- Relatório de defeitos encontrados (passos para reproduzir, evidência):
  [`docs/bugs-encontrados.md`](bugs-encontrados.md).

## 8. Melhorias propostas (resumo)

1. Corrigir os defeitos documentados em
   [docs/bugs-encontrados.md](bugs-encontrados.md) (campo Colaborador nos
   modos "Sem Colaborador"/"Subárea"; `data-bs-dismiss` no modal de Termos;
   investigar a causa raiz do BUG-03).
2. Adicionar atributos `data-cy`/`data-testid` nos elementos-chave dos
   formulários — reduziria o acoplamento dos testes à estrutura de
   ids/classes do Rails/Bootstrap, tornando a suíte mais resiliente a
   refatorações visuais.
3. Expor um endpoint (mesmo que interno/autenticado) para provisionamento
   de massa de dados de teste, eliminando a necessidade da estratégia de
   retentativa descrita na seção 2.3 e tornando os testes de vínculo de
   ativos determinísticos.
4. Padronizar mensagens de validação (a mistura de validação nativa HTML5,
   alertas via `window.alert`, e flash messages do servidor dificulta uma
   experiência de erro consistente para o usuário final e para automação).
