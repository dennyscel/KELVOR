# KELVOR — GitHub setup pelo celular

## Repositório

`dennyscel/KELVOR` foi criado como repositório privado com branch `main`. O bootstrap é publicado diretamente nele.

## Entrada dos binários grandes
Não grave os ZIPs grandes no histórico normal do Git.

Os workflows recebem:

1. uma URL HTTPS de download direto do ZIP; e
2. o SHA-256 esperado.

O download é recusado se o hash divergir.

### QA 84 v005
Arquivo esperado:
`KELVOR_QA_84_RECOVERY_v005_20260905.zip`

SHA-256:
`c99e41fb9e77ce4b2664dcb04c2ab357f78775a5d4da16b0375b0eeacaa4d370`

### Campanha integrada RC39 v003
Arquivo esperado:
`KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v003_20260905.zip`

SHA-256:
`de512945b761a9423e68591e94b8bfad231498403a2aa253105cdbcebf324c86`

A opção preferida para as URLs é usar assets de uma Release do próprio repositório KELVOR. Uma URL externa também pode ser usada, desde que seja HTTPS, entregue os bytes reais do ZIP sem página intermediária e produza exatamente o SHA-256 registrado.

## Rodar o QA 84
GitHub → KELVOR → Actions → `KELVOR QA 84 - Windows` → Run workflow.

Informe a URL do QA v005. Não mude o SHA salvo sem uma nova versão deliberada e documentada.

Resultado: artifact `KELVOR-QA84-WINDOWS-<run>` contendo `RESULTADOS_84`.

## Rodar a campanha integrada
Actions → `KELVOR RC39 v003 Campaign - Windows` → Run workflow.

Informe a URL do candidato integrado RC39 v003.

Resultado: artifact `KELVOR-RC39-V003-CAMPAIGN-WINDOWS-<run>` contendo `RESULTADOS_CAMPANHA_RC39_V003`.

## Preview jogável no celular
Actions → `KELVOR Pages Preview` → Run workflow.

O workflow publica somente a pasta `web/` do candidato validado. Ele não publica QA, docs privados, backups ou ZIPs.

Se Pages não estiver disponível para a visibilidade/plano do repositório, isso é bloqueio de hospedagem, não FAIL do jogo. Não altere o jogo para contornar esse bloqueio.

## Regras de gate
- GitHub Actions PASS técnico não equivale a Owner QA.
- Headless não substitui mobile físico.
- Pages não equivale a Hostinger final.
- Nenhum workflow deste bootstrap cria `LOCKED`.
