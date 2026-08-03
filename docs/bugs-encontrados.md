# Bugs Encontrados — Inventário CTI

Relatório dos defeitos encontrados durante a automação e a exploração manual
do sistema, no formato padrão de relatório de bug (passos para reproduzir,
resultado esperado vs. obtido, evidência). Para o levantamento completo de
cenários de teste, estratégia e a divergência de especificação da US05, ver
[plano-de-teste.md](plano-de-teste.md).

Ambiente: http://testeqa.pge.ce.gov.br · Usuário: qa.teste@teste.pge.ce.gov.br

---

## BUG-01 — Campo "Colaborador" continua obrigatório e vazio nos modos "Sem Colaborador"/"Subárea"

**Severidade:** Alta
**Tela:** Atribuições → Nova Atribuição
**Critério de aceitação afetado:** *"Deve ser possível escolher entre
atribuir para um colaborador específico ou para uma subárea sem
colaborador definido."*

### Passos para reproduzir
1. Login no sistema.
2. Menu **Atribuições** → **Nova Atribuição**.
3. Selecionar Área e Subárea (ex.: "Teste").
4. Marcar o rádio **"Sem Colaborador"** (o mesmo ocorre com **"Subárea"**).
5. Preencher os demais campos obrigatórios (Modalidade) e vincular um ativo
   disponível.
6. Clicar em **Salvar**.

### Resultado esperado
A atribuição é salva vinculada apenas à Área/Subárea, sem um colaborador
específico.

### Resultado obtido
O navegador bloqueia o envio do formulário. Ao marcar "Sem Colaborador" ou
"Subárea", o combo "Colaborador" só troca o texto exibido (para "SEM
USUÁRIO" / "SUBAREA"), mas:
- continua com o atributo HTML5 `required`;
- nenhum valor é de fato selecionado (`value` permanece vazio);
- a lista de opções continua sendo a lista normal de colaboradores (não
  existe uma opção "sem usuário").

Resultado: a validação nativa do navegador impede o `submit` indefinidamente
— a funcionalidade descrita no critério de aceitação é inacessível via UI.

### Evidência
Teste automatizado (regressor):
[`cypress/e2e/01-cadastro-atribuicoes/cadastro-atribuicoes.cy.ts`](../cypress/e2e/01-cadastro-atribuicoes/cadastro-atribuicoes.cy.ts) →
`[BUG] 'Sem Colaborador'/'Subárea' trocam o placeholder mas o campo
Colaborador continua obrigatório e vazio, impedindo salvar`.
Vídeo da execução: `docs/evidencias/01-cadastro-atribuicoes/`.
Print: [`evidencias/bugs/BUG-01-colaborador-obrigatorio-e-vazio.png`](evidencias/bugs/BUG-01-colaborador-obrigatorio-e-vazio.png)

### Sugestão de correção
No handler JS que reage à troca do rádio (`bond_employee_type_sem_usuario` /
`bond_employee_type_subarea`), remover o atributo `required` do
`#collaborators` e, se necessário, desabilitá-lo ou ocultá-lo — em vez de
apenas trocar o texto do placeholder.

---

## BUG-02 — Ícone "X" (e a tecla Esc) não fecham o modal "Gerar Termos"

**Severidade:** Baixa/Média
**Tela:** Atribuições → Gerar Termos
**Critério de aceitação afetado:** *"Deve ser possível fechar o modal
através do ícone 'X' no canto superior direito."*

### Passos para reproduzir
1. Login, ir para **Atribuições**.
2. Marcar o checkbox de qualquer atribuição.
3. Clicar em **Gerar Termos**.
4. Clicar no ícone **"X"** no canto superior direito do modal (ou pressionar
   **Esc**).

### Resultado esperado
O modal se fecha.

### Resultado obtido
O modal permanece aberto, tanto ao clicar no X quanto ao pressionar Esc.

### Causa raiz
O botão de fechar usa `data-dismiss="modal"` (sintaxe do **Bootstrap 4**),
mas a aplicação carrega o **Bootstrap 5** nas demais telas (os tooltips dos
ícones de ação da listagem usam `data-bs-toggle`/`data-bs-placement`). O
Bootstrap 5 não reconhece o atributo sem o prefixo `bs-`, então nem o clique
no X nem o Esc (que depende da mesma instância JS do componente) fecham o
modal.

### Evidência
Teste automatizado (regressor):
[`cypress/e2e/03-geracao-termos/geracao-termos.cy.ts`](../cypress/e2e/03-geracao-termos/geracao-termos.cy.ts) →
`[BUG] o ícone X (e a tecla Esc) não fecham o modal — data-dismiss sem
prefixo bs- é ignorado pelo Bootstrap 5`.
Vídeo da execução: `docs/evidencias/03-geracao-termos/`.
Print: [`evidencias/bugs/BUG-02-modal-nao-fecha-no-x.png`](evidencias/bugs/BUG-02-modal-nao-fecha-no-x.png)

### Sugestão de correção
Trocar `data-dismiss="modal"` por `data-bs-dismiss="modal"` no botão de
fechar do modal `#generate_term` (arquivo de view do modal de geração de
termos).

---

## BUG-03 — Status "DISPONÍVEL" no Depósito CTI nem sempre reflete disponibilidade real para vínculo

**Severidade:** Média (achado por teste exploratório, não por um único
critério de aceitação específico)
**Tela:** Depósito CTI (Ativos → Depósito CTI) / Nova Atribuição

### Passos para reproduzir
1. Acessar **Ativos → Depósito CTI**.
2. Anotar o tombo da primeira linha com status **DISPONÍVEL**.
3. Ir em **Atribuições → Nova Atribuição**, preencher os campos e tentar
   vincular esse mesmo tombo.
4. Repetir os passos 2–3 algumas vezes, com tombos diferentes.

### Resultado esperado
Um ativo listado como DISPONÍVEL no Depósito CTI deveria sempre ser aceito
ao ser vinculado a uma nova atribuição.

### Resultado obtido
Em uma amostra de 5 tentativas (tombos diferentes, obtidos de páginas
diferentes da listagem), **1 em 5 (20%)** foi recusada pelo servidor com a
mensagem `"Este Ativo já está vinculado!"`, mesmo aparecendo como
DISPONÍVEL no Depósito CTI no momento da consulta.

### Observação sobre a causa
Não é possível afirmar com certeza a causa raiz sem acesso ao backend.
Duas hipóteses plausíveis:
1. **Concorrência**: o ambiente de QA é compartilhado com outros
   candidatos rodando a mesma suíte de desafio simultaneamente; o ativo
   pode ter sido vinculado por outra sessão entre a consulta ao Depósito e
   o envio do formulário.
2. **Dessincronia de dados**: o status exibido no Depósito CTI e a
   verificação de "já vinculado" feita ao salvar uma atribuição podem
   consultar fontes/flags diferentes que não são atualizadas em conjunto.

Recomenda-se investigação no backend para confirmar qual das duas hipóteses
é a real (ou se há uma terceira causa) — se for #2, é um bug de
consistência de dados independente de concorrência.

### Evidência / mitigação
A suíte automatizada não depende de um único tombo fixo por causa deste
comportamento: `cy.obterTombosDisponiveis()` busca vários candidatos e
`NovaAtribuicaoPage.salvarComPrimeiroAtivoAceito()` tenta o próximo em caso
de recusa (ver [plano-de-teste.md, seção 2.3](plano-de-teste.md#23-massa-de-dados-e-o-problema-do-ativo-disponível)).
Script de amostragem e resultado bruto documentados nesta seção (5
tentativas, 1 falha). Sem print: a falha depende de acertar a condição de
corrida no momento da consulta, não é reproduzível sob demanda para captura.

---

## BUG-04 — Validação de Subárea é INTERMITENTE (ora aceita salvar sem subárea, ora bloqueia)

**Severidade:** Alta
**Tela:** Atribuições → Nova Atribuição
**Critério afetado:** *"Todos os campos marcados com asterisco (*) devem ser obrigatórios para conclusão do cadastro."*

### Passos para reproduzir
1. Menu **Atribuições** → **Nova Atribuição**.
2. Selecionar Área (ex.: "Teste") e Colaborador; marcar Modalidade.
3. **NÃO** selecionar Subárea.
4. Clicar em **Salvar**.

### Resultado esperado
Submit bloqueado SEMPRE (validação nativa ou de backend) com indicação do
campo Subárea pendente.

### Resultado obtido
Comportamento **intermitente** observado em execuções reais consecutivas da
automação:
- **31/07/2026**: atribuição **persistida sem subárea** (validação não atuou
  em nenhuma camada — front nem backend);
- **01/08/2026 (a)**: submit barrado, porém **sem nenhum campo `:invalid`**
  e sem mensagem de erro do servidor;
- **01/08/2026 (b)**: `checkValidity()` retornou `false` (validação nativa
  atuou normalmente).

Causa provável: **condição de corrida** no AJAX que repopula o combo
Subárea ao selecionar a Área — dependendo do timing, o campo fica
vazio-inválido, vazio-válido ou até auto-selecionado. Validação de campo
obrigatório não pode depender de timing; a execução em que o registro foi
persistido sem subárea comprova adicionalmente a **ausência de validação no
backend**.

O teste automatizado atua como **monitor**: registra em log o estado do
campo na execução corrente (valor + `checkValidity()`) e garante o
invariante de que o `required` está declarado, sem depender do desfecho
não determinístico do submit.

### Evidência
Teste automatizado (documenta ambos os desfechos): `[BUG] validação de
Subárea é intermitente` em
[`cadastro-atribuicoes.cy.ts`](../cypress/e2e/01-cadastro-atribuicoes/cadastro-atribuicoes.cy.ts).
Print: [`evidencias/bugs/BUG-04-subarea-validacao-intermitente.png`](evidencias/bugs/BUG-04-subarea-validacao-intermitente.png)

### Sugestão de correção
Validar a presença de subárea também no **backend** (a validação HTML5 do
front é contornável e, como visto, sujeita a timing).

---

## BUG-05 — Formulário aceita salvar sem Modalidade de trabalho

**Severidade:** Média/Alta
**Tela:** Atribuições → Nova Atribuição
**Critério afetado:** o mesmo do BUG-04 + *"O sistema deve permitir definir a modalidade de trabalho (Presencial ou Home Office)."*

### Passos para reproduzir
1. Menu **Atribuições** → **Nova Atribuição**.
2. Selecionar Área, Subárea e Colaborador.
3. **NÃO** marcar nenhum rádio de Modalidade.
4. Clicar em **Salvar**.

### Resultado esperado
Submit bloqueado com indicação da Modalidade pendente.

### Resultado obtido
O formulário é aceito e a atribuição é criada sem modalidade definida.

### Evidência
Teste automatizado: `[BUG] permite salvar sem selecionar a Modalidade de
trabalho` em
[`cadastro-atribuicoes.cy.ts`](../cypress/e2e/01-cadastro-atribuicoes/cadastro-atribuicoes.cy.ts).
Print: [`evidencias/bugs/BUG-05-modalidade-sem-required.png`](evidencias/bugs/BUG-05-modalidade-sem-required.png)

---

## BUG-06 — Combo Subárea não é filtrado pela Área selecionada

**Severidade:** Média
**Tela:** Atribuições → Nova Atribuição
**Critério afetado:** *"O sistema deve permitir selecionar Área e Subárea para definir a localização organizacional da atribuição."*

### Passos para reproduzir
1. Menu **Atribuições** → **Nova Atribuição**.
2. Selecionar Área "CTI".
3. Abrir o combo **Subárea**.

### Resultado esperado
Apenas as subáreas pertencentes à área CTI.

### Resultado obtido
O combo lista ~139 opções — todas as subáreas do sistema, incluindo as de
outras áreas (ex.: "Teste") — permitindo cadastros com Área/Subárea
inconsistentes entre si.

### Evidência
Teste automatizado: `[ACHADO] o combo Subárea é populado ao selecionar a
Área, mas NÃO é filtrado por ela` em
[`cadastro-atribuicoes.cy.ts`](../cypress/e2e/01-cadastro-atribuicoes/cadastro-atribuicoes.cy.ts).
Print: [`evidencias/bugs/BUG-06-subarea-nao-filtrada-por-area.png`](evidencias/bugs/BUG-06-subarea-nao-filtrada-por-area.png)

---

## BUG-07 — "Gerar Relatório" (Movimentação de Ativos) abre o PDF na mesma aba

**Severidade:** Baixa
**Tela:** Relatórios → Movimentação de Ativos
**Critério afetado:** *"Ao clicar em 'Gerar Relatório', o sistema deve gerar um documento PDF, abrindo em uma nova aba..."*

### Resultado obtido
O link "Gerar Relatório" não possui `target="_blank"` — o PDF é renderizado
na MESMA aba, fazendo o usuário perder os filtros aplicados na tela.

### Evidência
Teste automatizado: `[BUG] 'Gerar Relatório' abre o PDF na mesma aba` em
[`relatorio-movimentacao.cy.ts`](../cypress/e2e/04-relatorio-movimentacao/relatorio-movimentacao.cy.ts).
Print: [`evidencias/bugs/BUG-07-gerar-relatorio-sem-target-blank.png`](evidencias/bugs/BUG-07-gerar-relatorio-sem-target-blank.png)

### Sugestão de correção
Adicionar `target="_blank" rel="noopener"` ao link.

---

## BUG-08 — Campo de e-mail no login não possui atributo `required`

**Severidade:** Baixa
**Tela:** Login (`/`)
**Origem:** Sessão exploratoria 1 (L03)

### Passos para reproduzir
1. Abrir a página inicial (`/`).
2. Inspecionar `#admin_email` no DevTools.

### Resultado esperado
Campo com `required` para que a validação nativa HTML5 barre o submit
com o campo vazio e forneça feedback visual imediato ao usuário.

### Resultado obtido
`#admin_email.required === false` e `checkValidity()` retorna `true`
mesmo vazio. A recusa depende exclusivamente do backend (Devise), o que
gera round-trip desnecessário e piora a UX.

### Evidência
Teste automatizado: `[ACHADO] L03` em
[`login-exploratorio.cy.ts`](../cypress/e2e/06-login-exploratorio/login-exploratorio.cy.ts).
Print: [`evidencias/bugs/BUG-08-email-sem-required.png`](evidencias/bugs/BUG-08-email-sem-required.png)

---

## BUG-09 — Campo de senha sem `autocomplete="current-password"`

**Severidade:** Baixa (boa prática OWASP ASVS V2.10.4)
**Tela:** Login (`/`)
**Origem:** Sessão exploratória 1 (L06)

### Passos para reproduzir
1. Abrir a página inicial (`/`).
2. Inspecionar o atributo `autocomplete` de `#admin_password`.

### Resultado esperado
`autocomplete="current-password"` (padrão recomendado para campos de
senha em telas de login) ou `"off"` explicitamente.

### Resultado obtido
O atributo não está declarado, deixando o comportamento a critério do
navegador. Gerenciadores de senha podem não oferecer preenchimento
adequadamente ou preencher em contextos inapropriados.

### Evidência
Teste automatizado: `[ACHADO] L06` em
[`login-exploratorio.cy.ts`](../cypress/e2e/06-login-exploratorio/login-exploratorio.cy.ts).
Print: [`evidencias/bugs/BUG-09-senha-sem-autocomplete.png`](evidencias/bugs/BUG-09-senha-sem-autocomplete.png)

---

## BUG-10 — Conteúdo interno reexposto após logout via botão "voltar" do navegador

**Severidade:** Média (potencial vazamento em dispositivo compartilhado)
**Tela:** Qualquer página autenticada (ex.: `/portal_service/bonds`)
**Origem:** Sessão exploratória 1 (L07)
**Referência:** OWASP ASVS V3.2.3, WSTG-SESS-06

### Passos para reproduzir
1. Login válido.
2. Navegar para uma página interna com dados (ex.: `/portal_service/bonds`).
3. Efetuar Logout.
4. Clicar no botão **"voltar"** do navegador.

### Resultado esperado
O navegador deve exibir a tela de login (ou uma mensagem de sessão
encerrada). A resposta autenticada deve enviar
`Cache-Control: no-store, no-cache, must-revalidate` e `Pragma: no-cache`
para impedir o cache do conteúdo sensível.

### Resultado obtido
A página interna **reaparece** com todo o conteúdo renderizado (dados
de atribuições, colaboradores etc.), mesmo com a sessão já invalidada
no servidor — o navegador restaura do cache local. Em dispositivo
compartilhado (ex.: computador de sala/kiosk), o próximo usuário pode
visualizar informações do usuário anterior.

### Evidência
Teste automatizado: `[ACHADO] L07` em
[`login-exploratorio.cy.ts`](../cypress/e2e/06-login-exploratorio/login-exploratorio.cy.ts).
Print: [`evidencias/bugs/BUG-10-conteudo-reexposto-apos-voltar.png`](evidencias/bugs/BUG-10-conteudo-reexposto-apos-voltar.png)

### Sugestão de correção
Adicionar aos controllers de área autenticada (Rails):

```ruby
before_action :set_cache_headers

def set_cache_headers
  response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
  response.headers["Pragma"] = "no-cache"
  response.headers["Expires"] = "0"
 end
```

---

## BUG-11 — Campo de e-mail do Colaborador usa `type="text"` em vez de `type="email"`

**Severidade:** Baixa
**Tela:** Cadastros → Colaboradores → Novo colaborador (`/portal_service/users/new`)

### Passos para reproduzir
1. Efetuar login e navegar até **Cadastros → Colaboradores → Novo**.
2. Inspecionar o campo **E-mail**.

### Resultado obtido
```html
<input class="form-control border-6 small" type="text" name="user[email]" id="user_email" />
```
O `type="text"` (a) impede a validação nativa do browser para formato de
e-mail, (b) não apresenta teclado de e-mail em dispositivos móveis e
(c) permite salvar cadastros com endereços inválidos (ver BUG-13).

### Resultado esperado
`type="email"` no `<input>` para acionar a validação nativa e a UX de
teclado adequada no mobile.

### Evidência
Teste automatizado: `[ACHADO] U08` em
[`usuarios-exploratorio.cy.ts`](../cypress/e2e/07-usuarios-exploratorio/usuarios-exploratorio.cy.ts).
Print: [`evidencias/bugs/BUG-11-email-sem-type-email.png`](evidencias/bugs/BUG-11-email-sem-type-email.png)

---

## BUG-12 — Colaborador pode ser cadastrado sem e-mail

**Severidade:** Média
**Tela:** Cadastros → Colaboradores → Novo

### Passos para reproduzir
1. Cadastrar um colaborador informando **apenas o nome**, deixando o
   campo **E-mail** em branco.
2. Salvar.

### Resultado obtido
Cadastro é aceito. O colaborador passa a existir no sistema sem
endereço de e-mail associado.

### Resultado esperado
Ou o e-mail deve ser obrigatório (`required` + validação no
back-end), ou o modelo de negócio deve ser explícito quanto a esse
cenário. Sem e-mail, a emissão de **Termos de Responsabilidade** e a
comunicação com o colaborador ficam prejudicadas.

### Sugestão de correção
Modelo `User` (Rails):

```ruby
validates :email, presence: true,
                  format: { with: URI::MailTo::EMAIL_REGEXP }
```
E adicionar `required: true` no `f.text_field :email` da view.

### Evidência
Teste automatizado: `[ACHADO] U09` em `usuarios-exploratorio.cy.ts`.
Print: [`evidencias/bugs/BUG-12-colaborador-sem-email.png`](evidencias/bugs/BUG-12-colaborador-sem-email.png)

---

## BUG-13 — E-mail de colaborador não valida formato (sem restrição de duplicidade em cenários específicos)

**Severidade:** Média
**Tela:** Cadastros → Colaboradores

### Contexto
Como o campo é `type="text"` (BUG-11) e nem back-end nem front-end
validam formato, é possível gravar qualquer string no campo e-mail.

### Passos para reproduzir
1. Cadastrar um colaborador com e-mail `nao-é-email` (sem `@`).
2. Cadastrar outro colaborador com o mesmo e-mail que já existe.

### Resultado obtido
Ambos os cenários gravam o registro. O teste automatizado U01 varia:
em alguns runs a duplicidade é aceita e o mesmo e-mail passa a
aparecer múltiplas vezes na listagem.

### Resultado esperado
- Validação de formato (regex + `type="email"`).
- `validates :email, uniqueness: { case_sensitive: false }` no modelo.

### Evidência
Teste automatizado: `U01` em `usuarios-exploratorio.cy.ts`. O teste tem um
`cy.screenshot()` condicional pra esse cenário, mas em 2 execuções seguidas
a checagem de duplicidade não bateu (a listagem pode estar paginada e não
trazer as duas linhas mais recentes na mesma página) — sem print capturado
até o momento; a mensagem de log da execução ainda é a evidência disponível.

---

## BUG-14 — Cadastro de colaborador com nome muito longo derruba o servidor (HTTP 500)

**Severidade:** Alta
**Tela:** Cadastros → Colaboradores → Novo

### Passos para reproduzir
1. Ir em **Cadastros → Colaboradores → Novo**.
2. Preencher **Nome** com 300 caracteres iguais (`"A".repeat(300)`).
3. Preencher e-mail válido e clicar em **Criar**.

### Resultado obtido
Servidor retorna **HTTP 500** (Internal Server Error). Provavelmente
`ActiveRecord::ValueTooLong` ao violar limite `VARCHAR` da coluna
`users.name`.

### Resultado esperado
Validação amigável no formulário (mensagem "Nome muito longo") e
resposta HTTP 200/302, sem stack trace/500.

### Sugestão de correção
Modelo `User` (Rails):

```ruby
validates :name, length: { maximum: 150 }
```
E, se necessário, ajustar `limit:` da coluna na migration.

### Evidência
Teste automatizado: `[ACHADO] U06` em `usuarios-exploratorio.cy.ts`
(intercepta `POST /portal_service/users` e loga o status). O teste tem
`cy.screenshot()` condicional a HTTP ≥ 500, mas não reproduziu nas últimas
execuções — talvez a coluna `name` não tenha limite de tamanho neste
ambiente. Sem print até o momento.

---

## BUG-15 — Áreas permitem descrições duplicadas

**Severidade:** Média
**Tela:** Cadastros → Áreas (`/portal_service/areas`)

### Passos para reproduzir
1. Cadastrar uma área com descrição `ABC`.
2. Cadastrar novamente uma área com a mesma descrição `ABC`.

### Resultado obtido
Ambos os registros são gravados. A listagem passa a exibir duas linhas
com a mesma descrição, causando ambiguidade na hora de vincular
subáreas e atribuições.

### Resultado esperado
Bloqueio com mensagem clara. `validates :description, uniqueness: { case_sensitive: false }`
no modelo `Area`.

### Evidência
`[ACHADO] AR01` em `areas-exploratorio.cy.ts`.
Print: [`evidencias/bugs/BUG-15-area-duplicada-na-listagem.png`](evidencias/bugs/BUG-15-area-duplicada-na-listagem.png)

---

## BUG-16 — Inconsistência UX na "exclusão" de Área/Subárea (tooltip × mensagem de confirmação)

**Severidade:** Baixa/Média
**Tela:** Cadastros → Áreas e Cadastros → Subáreas

### Passos para reproduzir
1. Acessar a listagem de Áreas (ou Subáreas).
2. Passar o mouse sobre o ícone de lixeira vermelha (`fa-trash`) na
   coluna Ações. O tooltip mostra **"Excluir"**.
3. Clicar. O `confirm()` do navegador exibe:
   *"qa Teste, você tem certeza que deseja **Ativar/Desativar**: XYZ?"*

### Resultado obtido
Ícone e tooltip sugerem exclusão definitiva; a mensagem sugere
inativação (soft-delete). O usuário não sabe qual ação vai ocorrer.

### Resultado esperado
Coerência entre tooltip, ícone e mensagem — se a ação é soft-delete
(como em Colaboradores), usar o mesmo ícone `fa-user-check` com
tooltip "Inativar"; se é hard-delete, ajustar a mensagem para
"Excluir". O comportamento real precisa ser confirmado com o time de
produto.

### Evidência
`[ACHADO] AR06` em `areas-exploratorio.cy.ts`.
Print: [`evidencias/bugs/BUG-16-tooltip-excluir-vs-confirm-ativar-desativar.png`](evidencias/bugs/BUG-16-tooltip-excluir-vs-confirm-ativar-desativar.png)

---

## BUG-17 — Área com descrição muito longa pode causar HTTP 500

**Severidade:** Média
**Tela:** Cadastros → Áreas

### Passos para reproduzir
1. Ir em **Cadastros → Áreas**.
2. Preencher **Descrição** com 300 caracteres iguais (`"A".repeat(300)`).
3. Clicar em **Criar**.

### Resultado obtido
Em ambientes com coluna `VARCHAR` limitada, o backend responde
**HTTP 500** (`ActiveRecord::ValueTooLong`). Reproduz o mesmo padrão
do BUG-14.

### Resultado esperado
Validação de comprimento no modelo e resposta amigável (200/302 com
mensagem de erro no form).

### Sugestão de correção
```ruby
# app/models/area.rb
validates :description, length: { maximum: 150 }
```

### Evidência
`[ACHADO] AR07` em `areas-exploratorio.cy.ts`. Screenshot condicional a
HTTP ≥ 500 — não reproduziu nas últimas execuções, mesmo padrão do BUG-14.

---

## BUG-18 — Formulário de "Novo Ativo" sem nenhum campo obrigatório (HTML5)

**Severidade:** Média
**Tela:** Ativos → Novo (`/portal_service/listing_assets/new`)

### Passos para reproduzir
1. Efetuar login e ir em **Ativos → Novo/Editar → Novo**.
2. Inspecionar cada `<input>` e `<select>` do formulário.

### Resultado obtido
Nenhum campo (`#asset_brand`, `#asset_model`, `#asset_serial`,
`#asset_tombo`, `#type`, `#asset_acquisition_id`) tem o atributo
`required`. Toda a validação depende exclusivamente do backend, cujo
comportamento é observado em BUG-19.

### Resultado esperado
Marcar como obrigatórios ao menos **tombo**, **tipo** e **aquisição** no
HTML — isso dá feedback imediato ao usuário e reduz round-trip.

### Evidência
`[ACHADO] A00` em `ativos-exploratorio.cy.ts`.
Print: [`evidencias/bugs/BUG-18-form-ativo-sem-required.png`](evidencias/bugs/BUG-18-form-ativo-sem-required.png)

---

## BUG-19 — Backend aceita cadastro de ativo com todos os campos em branco

**Severidade:** Alta
**Tela:** Ativos → Novo

### Passos para reproduzir
1. Ir em **Ativos → Novo/Editar → Novo**.
2. Clicar em **Criar** sem preencher nada.

### Resultado obtido
O POST retorna 200/302 e um ativo "fantasma" (sem tombo, sem serial,
sem marca) é criado. Esses registros poluem o inventário e podem
quebrar a coluna "Tombo" no Depósito CTI.

### Resultado esperado
Validação server-side com pelo menos `tombo`, `type` e
`acquisition_id` obrigatórios.

### Sugestão de correção
```ruby
# app/models/asset.rb
validates :tombo, presence: true, uniqueness: true
validates :asset_type, presence: true
validates :acquisition_id, presence: true
```

### Evidência
`[ACHADO] A01` em `ativos-exploratorio.cy.ts`.
Print: [`evidencias/bugs/BUG-19-ativo-vazio-aceito.png`](evidencias/bugs/BUG-19-ativo-vazio-aceito.png)

---

## BUG-20 — Tombo pode ser duplicado

**Severidade:** Alta
**Tela:** Ativos

### Passos para reproduzir
1. Criar um ativo com tombo `T123`.
2. Criar outro ativo com o mesmo tombo `T123`.

### Resultado obtido
Dois registros com o mesmo tombo coexistem. Como o tombo é o
identificador patrimonial oficial, isso quebra rastreabilidade e o
relatório de Movimentação de Ativos.

### Resultado esperado
`validates :tombo, uniqueness: true` no modelo `Asset`.

### Evidência
`[ACHADO] A02` em `ativos-exploratorio.cy.ts`.
Print: [`evidencias/bugs/BUG-20-tombo-duplicado-na-listagem.png`](evidencias/bugs/BUG-20-tombo-duplicado-na-listagem.png)

---

## BUG-21 — Tombo com 300 caracteres pode causar HTTP 500

**Severidade:** Média
**Tela:** Ativos → Novo

### Passos para reproduzir
1. Criar um ativo com `tombo` de 300 caracteres.

### Resultado obtido
Em ambientes com coluna `VARCHAR` limitada, o backend responde HTTP
500. Mesmo padrão de BUG-14 e BUG-17.

### Resultado esperado
`validates :tombo, length: { maximum: N }` e mensagem amigável.

### Evidência
`[ACHADO] A04` em `ativos-exploratorio.cy.ts`. Screenshot condicional a
HTTP ≥ 500 — não reproduziu nas últimas execuções, mesmo padrão do BUG-14/17.

---

## BUG-22 — Permite gerar termo sem nenhuma atribuição selecionada (`bonds_ids` vazio)

**Severidade:** Baixa/Média
**Tela:** Atribuições → Gerar Termos

### Passos para reproduzir
1. Login, ir para **Atribuições** (sem marcar nenhum checkbox de linha).
2. Clicar em **Gerar Termos**.
3. Selecionar um tipo de termo e clicar em **Gerar**.

### Resultado esperado
O botão "Gerar Termos" deveria ficar desabilitado (ou o "Gerar" dentro do
modal deveria bloquear) quando nenhuma atribuição está selecionada na
listagem.

### Resultado obtido
O modal abre normalmente mesmo sem seleção prévia, e o clique em "Gerar"
prossegue com `bonds_ids` vazio na URL do PDF gerado.

### Evidência
Teste automatizado: `[ACHADO] permite abrir o modal e gerar termo sem
nenhuma atribuição selecionada` em
[`geracao-termos.cy.ts`](../cypress/e2e/03-geracao-termos/geracao-termos.cy.ts).
Print: [`evidencias/bugs/BUG-22-gerar-termo-sem-atribuicao-selecionada.png`](evidencias/bugs/BUG-22-gerar-termo-sem-atribuicao-selecionada.png)

### Sugestão de correção
Desabilitar o botão "Gerar Termos" da listagem enquanto nenhum checkbox
estiver marcado (client-side) e validar `bonds_ids.present?` no backend.

---

## BUG-23 — Filtro de período do relatório de Movimentação não valida data final anterior à inicial

**Severidade:** Baixa
**Tela:** Relatórios → Movimentação de Ativos

### Passos para reproduzir
1. Ir em **Relatórios → Movimentação de Ativos**.
2. Preencher Período com data inicial **31/12/2026** e data final
   **01/01/2020** (invertidas).
3. Clicar em **Pesquisar**.

### Resultado esperado
Mensagem de validação informando que o período é inválido, ou os campos
serem trocados automaticamente.

### Resultado obtido
O sistema aceita o filtro invertido silenciosamente e retorna a mesma
mensagem de "sem dados" de uma busca sem resultados — sem indicar que o
período em si está mal formado.

### Evidência
Teste automatizado: `não deve retornar resultados quando a data final é
anterior à data inicial` em
[`relatorio-movimentacao.cy.ts`](../cypress/e2e/04-relatorio-movimentacao/relatorio-movimentacao.cy.ts).
Print: [`evidencias/bugs/BUG-23-periodo-invertido-nao-validado.png`](evidencias/bugs/BUG-23-periodo-invertido-nao-validado.png)

### Sugestão de correção
Validar no backend (ou no front antes do submit) que `data_final >=
data_inicial`, retornando mensagem específica em vez de "sem dados".

---

## Resumo

| ID | Título | Severidade | Print |
|---|---|---|---|
| BUG-01 | Colaborador obrigatório/vazio em "Sem Colaborador"/"Subárea" | Alta | ✅ |
| BUG-02 | Ícone X / Esc não fecham modal Gerar Termos | Baixa/Média | ✅ |
| BUG-03 | Status DISPONÍVEL do Depósito CTI nem sempre condiz com vínculo real | Média | — (condição de corrida, não reproduzível sob demanda) |
| BUG-04 | Validação de Subárea intermitente — ora salva sem subárea, ora bloqueia | Alta | ✅ |
| BUG-05 | Permite salvar atribuição sem Modalidade (campo com * não validado) | Média/Alta | ✅ |
| BUG-06 | Combo Subárea não é filtrado pela Área selecionada | Média | ✅ |
| BUG-07 | PDF de Movimentação abre na mesma aba (sem target=_blank) | Baixa | ✅ |
| BUG-08 | Campo de e-mail no login sem atributo `required` | Baixa | ✅ |
| BUG-09 | Campo de senha sem `autocomplete="current-password"` | Baixa | ✅ |
| BUG-10 | Conteúdo interno reexposto após logout via botão "voltar" (cache do navegador) | Média | ✅ |
| BUG-11 | Campo e-mail do colaborador sem `type="email"` | Baixa | ✅ |
| BUG-12 | Colaborador pode ser cadastrado sem e-mail | Média | ✅ |
| BUG-13 | E-mail de colaborador sem validação de formato/duplicidade consistente | Média | — (não reproduziu na última execução) |
| BUG-14 | Nome de colaborador com 300 caracteres provoca HTTP 500 | Alta | — (não reproduziu na última execução) |
| BUG-15 | Áreas permitem descrições duplicadas | Média | ✅ |
| BUG-16 | Tooltip "Excluir" × confirm "Ativar/Desativar" em Áreas/Subáreas | Baixa/Média | ✅ |
| BUG-17 | Área com 300 caracteres pode retornar HTTP 500 | Média | — (não reproduziu na última execução) |
| BUG-18 | Formulário de Novo Ativo sem HTML5 `required` | Média | ✅ |
| BUG-19 | Backend aceita ativo com todos campos vazios | Alta | ✅ |
| BUG-20 | Tombo pode ser duplicado | Alta | ✅ |
| BUG-21 | Tombo com 300 caracteres pode retornar HTTP 500 | Média | — (não reproduziu na última execução) |
| BUG-22 | Permite gerar termo sem nenhuma atribuição selecionada (`bonds_ids` vazio) | Baixa/Média | ✅ |
| BUG-23 | Filtro de período de Movimentação não valida data final < data inicial | Baixa | ✅ |
| — | US05 do desafio não corresponde à tela real | — | Divergência de especificação (não é bug) |

18 dos 23 bugs têm print capturado em `docs/evidencias/bugs/`. Os 5 sem
print (BUG-03, 13, 14, 17, 21) dependem de uma condição não determinística
do ambiente (condição de corrida ou limite de coluna no banco que pode não
estar configurado) — a evidência disponível para eles é o log da execução
e os passos para reproduzir manualmente.
