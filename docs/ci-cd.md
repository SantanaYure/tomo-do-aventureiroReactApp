# CI/CD — Tomo do Aventureiro

Pipeline em **GitHub Actions + Vercel**. Nenhuma ferramenta nova além do GitHub
Actions (repositório público → minutos gratuitos). Aproveita os scripts que já
existiam (`lint`, `typecheck`, `test`, `build`) e a **integração nativa da Vercel
com o GitHub**, que já cria Preview Deployments em todo PR.

## Estado atual (o que muda ao mergear este PR)

- **Passa a valer:** o job **`verify`** (CI) roda em todo PR para `main`/`develop`
  (lint · type check · testes · build · `npm audit`).
- **Não muda:** o **deploy continua como está** — Preview automático da Vercel em
  cada PR e produção pela Vercel + `vercel --prod` manual quando necessário.
- Os workflows de deploy via CLI (`deploy-staging`, `deploy-production`,
  `rollback`) entram **dormentes**: um job `guard` os pula enquanto o secret
  `VERCEL_TOKEN` não existir. São a opção "deploy 100% via CLI" pronta para
  ativar quando (e se) o time quiser.

## Fluxo

```
commit → Pull Request
           ├── verify (CI)  ── lint · typecheck · test · build · audit
           └── Vercel        ── Preview Deployment automático (nativo)
                    │
              Code Review (CODEOWNERS + aprovação)
                    │
        merge em develop ──▶ homologação  (deploy dormente: CLI + smoke quando ativado)
                    │
         PR develop → main
                    │
        merge em main ──▶ produção (Vercel nativo hoje; CLI + smoke quando ativado)
                    │
             monitoring.yml ── smoke agendado 6/6h contra produção
```

### Branches

| Branch      | Papel        | Deploy                                              |
|-------------|--------------|----------------------------------------------------|
| `feature/*` | trabalho     | Preview automático da Vercel no PR                  |
| `develop`   | homologação  | `…-staging.vercel.app` (quando o deploy CLI é ativado) |
| `main`      | produção     | `tomo-do-aventureiro-react-app.vercel.app`          |

PR de `feature/*` → `develop`. Depois de validar em homologação, PR `develop` → `main`.
A branch `develop` ainda não existe — crie com `git branch develop main && git push origin develop`.

## Workflows

| Arquivo | Gatilho | O que faz | Estado |
|---|---|---|---|
| `ci.yml` | PR p/ `main`/`develop` **e** `workflow_call` | `npm ci` → `lint` → `typecheck` → `test` → `build` → `npm audit --audit-level=high` | **ativo** |
| `deploy-staging.yml` | push em `develop` | job `ci` + (`vercel pull/build/deploy` → `vercel alias` → smoke) | job `ci` ativo; deploy **dormente** até `VERCEL_TOKEN` |
| `deploy-production.yml` | push em `main` | job `ci` + (`vercel build --prod` → `vercel deploy --prebuilt --prod` → smoke → rollback guiado em falha) | job `ci` ativo; deploy **dormente** até `VERCEL_TOKEN` |
| `rollback.yml` | manual (`workflow_dispatch`) | `vercel rollback` (deployment anterior ou alvo informado) → smoke | precisa de `VERCEL_TOKEN` |
| `monitoring.yml` | cron 6/6h + manual | smoke contra produção; job vermelho → GitHub notifica os mantenedores | **ativo** (roda a partir do `main`) |

Preview de PR: feito pela **integração nativa da Vercel** (não há workflow para
isso — seria duplicado). Aparece como o check **`Vercel`** no PR, com a URL no
comentário automático.

## Ativar o deploy via CLI (opcional)

1. Setar os secrets (seção abaixo). O `guard` passa a liberar os jobs de deploy.
2. Para **não** ter deploy de produção dobrado, desligue o deploy automático da
   Vercel para `main`: Project → Settings → Git → *Ignored Build Step* / desconectar,
   **ou** no `vercel.json`:
   ```json
   "git": { "deploymentEnabled": { "main": false } }
   ```
   (Staging não conflita — a Vercel não publica `develop` em produção.)
3. Criar a branch `develop` e (opcional) o alias de staging na primeira execução.

## Code Review + bloqueio de merge

Feito por **proteção de branch** (config no GitHub, não em arquivo). Requer `gh`
autenticado com admin no repo. Rode uma vez para `main` e uma para `develop`
(troque `BRANCH`):

```bash
BRANCH=main   # depois repita com BRANCH=develop
gh api -X PUT "repos/SantanaYure/tomo-do-aventureiroReactApp/branches/$BRANCH/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "verify" },
      { "context": "Vercel" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Resultado: nenhum push direto em `main`/`develop`; todo merge exige PR + 1
aprovação (CODEOWNERS pede automaticamente) + `verify` verde + Preview da Vercel verde.

> `verify` é o nome do job em `ci.yml`. `Vercel` é o check da integração nativa.
> Se um dia ativar `deploy-preview` num workflow, adicione o context correspondente.

## Secrets e variáveis

Necessários **apenas** para ativar o deploy via CLI (`deploy-staging`,
`deploy-production`, `rollback`). O `verify` (CI) e o `monitoring` **não** usam
secret nenhum.

### Secrets do repositório — `Settings → Secrets and variables → Actions → Secrets`

| Secret | Valor | Onde obter |
|---|---|---|
| `VERCEL_TOKEN` | token de acesso da conta | vercel.com → Account Settings → Tokens → *Create* (escopo: o time do projeto). **Só o dono da conta gera.** |
| `VERCEL_ORG_ID` | `team_X6sYYFd4wFFDeQMbhBvrVH8g` | `.vercel/project.json` (`orgId`) |
| `VERCEL_PROJECT_ID` | `prj_gjPux8zKY0ClVaiWSgIPAoKDouzq` | `.vercel/project.json` (`projectId`) |

```bash
gh secret set VERCEL_TOKEN       # cola o token quando pedir
gh secret set VERCEL_ORG_ID      --body "team_X6sYYFd4wFFDeQMbhBvrVH8g"
gh secret set VERCEL_PROJECT_ID  --body "prj_gjPux8zKY0ClVaiWSgIPAoKDouzq"
```

### Variáveis do repositório (opcionais — há defaults nos workflows)

| Variável | Default | Uso |
|---|---|---|
| `PRODUCTION_URL` | `tomo-do-aventureiro-react-app.vercel.app` | alvo do smoke de produção e do monitoramento |
| `STAGING_ALIAS` | `tomo-do-aventureiro-react-app-staging.vercel.app` | alias fixo do ambiente de staging |

### Variáveis de ambiente do app (Firebase)

- **Runtime / build da Vercel:** as chaves `VITE_FIREBASE_*` já estão no projeto
  da Vercel (produção no ar). `vercel pull` + `vercel build` as injetam. **Não**
  precisam ir para o GitHub.
- **Testes (CI):** não precisam de nenhuma env — `src/test/setup.ts` mocka
  `src/services/firebase.ts`, então a suíte roda sem `.env`.
- São identificadores públicos do cliente Firebase, não segredos de servidor
  (ver `.env.example`); a proteção real é `firestore.rules` + verificação de
  e-mail. O GitHub mascara secrets nos logs; o smoke só imprime URLs.

## Como testar o pipeline

1. **Localmente** (idêntico ao `verify`):
   ```bash
   npm ci && npm run lint && npm run typecheck && npm run test && npm run build
   npm run smoke -- https://tomo-do-aventureiro-react-app.vercel.app
   ```
2. **CI + Preview**: abra um PR (de `feature/*` para `develop` ou `main`).
   Confira o check **`verify`** verde, o check **`Vercel`** verde e o comentário
   da Vercel com a URL do Preview. Quebre um teste de propósito e confirme que
   `verify` fica vermelho (e, com a proteção de branch, o merge trava).
3. **Monitoramento**: *Actions → Production Monitoring → Run workflow*.
4. **(Opcional) Deploy via CLI** — depois de setar `VERCEL_TOKEN` e criar `develop`:
   - merge em `develop` → *Actions → Deploy Staging* → abrir o alias de staging;
   - PR `develop` → `main` → merge → *Actions → Deploy Production* → smoke verde;
   - *Actions → Rollback Production → Run workflow* (campo vazio) → produção volta
     ao deployment anterior.

## Rollback (resumo)

| Via | Comando |
|---|---|
| GitHub | *Actions → Rollback Production → Run workflow* (vazio = anterior) — requer `VERCEL_TOKEN` |
| CLI (local) | `vercel rollback --yes` (ou `vercel rollback <url-do-deployment-bom> --yes`) |
| Painel | Vercel → Deployments → deployment bom → ⋯ → *Promote to Production* |

## Melhorias futuras (não implementadas)

- **Ativar o deploy via CLI** de fato (setar `VERCEL_TOKEN`, criar `develop`,
  desligar o auto-deploy de produção da Vercel) — hoje fica dormente.
- **Custom Environment "staging"** na Vercel (`vercel deploy --target=staging`)
  com env vars próprias e URL nativa, dispensando `vercel alias`.
- Fixar a versão do Vercel CLI (`vercel@<major>`) em vez de `@latest`.
- **Cobertura de testes** com gate mínimo (`vitest run --coverage`).
- **Testes E2E** (Playwright) no smoke, cobrindo login e um fluxo de ficha.
- Estender o ESLint para `.ts/.tsx` (hoje só cobre `.js/.jsx`).
- Deploy automatizado das **regras do Firestore** (`firebase deploy --only
  firestore:rules`) quando `firestore.rules` mudar, com secret `FIREBASE_TOKEN`.
- **Dependabot / Renovate** para atualização de dependências.
- **Sentry / Vercel Log Drains** para monitoramento de erros em runtime.
- **Rolling Releases** da Vercel para rollout gradual em produção.
