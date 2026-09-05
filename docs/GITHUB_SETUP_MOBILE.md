# KELVOR — GitHub setup pelo celular

## Estado atual

`dennyscel/KELVOR` existe como repositório **privado**, branch `main`, e o bootstrap CI já está publicado.

O self-test Windows do GitHub Actions passou: Chrome headless alcança `127.0.0.1` dentro do runner. O GitHub pode, portanto, substituir o Windows local para os Gauntlets técnicos que usam o servidor Python local.

## Candidato atual

Arquivo:
`KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`

SHA-256:
`77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`

O v004 preserva **614/614** arquivos da release v003 byte-idênticos e acrescenta apenas dois runtimes v004 de apresentação/gauntlet. Não é LOCKED.

## Forma preferida de executar sem URL pública

Use uma **GitHub Release privada** no próprio repositório KELVOR.

1. Abra `dennyscel/KELVOR`.
2. Vá a **Releases**.
3. Crie uma nova release/tag, por exemplo `rc39-v004-ci`.
4. Anexe exatamente `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`.
5. Publique a Release.

A publicação dispara automaticamente:

- `KELVOR RC39 v004 Campaign - Windows`;
- `KELVOR Pages Preview`.

O workflow Windows baixa o asset da Release usando o `GITHUB_TOKEN` do repositório privado, verifica o SHA-256 esperado **antes** da extração e executa o runner original `RODAR_CAMPANHA_INTEGRADA_RC39_V004.py`.

Resultado esperado como artifact:
`KELVOR-RC39-V004-CAMPAIGN-WINDOWS-<run>` contendo `RESULTADOS_CAMPANHA_RC39_V004`.

Se o runner devolver REVIEW, o Action permanece não aprovado e as evidências são preservadas; os critérios não são alterados.

## QA 84 v005

O workflow histórico/isolado continua disponível:
`KELVOR QA 84 - Windows`.

Arquivo esperado:
`KELVOR_QA_84_RECOVERY_v005_20260905.zip`

SHA-256:
`c99e41fb9e77ce4b2664dcb04c2ab357f78775a5d4da16b0375b0eeacaa4d370`

## Preview no celular

`KELVOR Pages Preview` publica somente a pasta `web/` do **mesmo asset v004 verificado**. Nenhum QA ZIP, backup ou documento privado é publicado pela rotina de Pages.

Se GitHub Pages estiver indisponível para a visibilidade/plano do repositório, isso é bloqueio de hospedagem, não FAIL do jogo.

## Regras de gate

- GitHub Actions técnico não equivale a Owner QA.
- Headless não substitui mobile físico.
- Pages não equivale a Hostinger final.
- Nenhum workflow deste bootstrap cria `LOCKED`.
- RC35, RC37, v003 e demais candidatos anteriores permanecem preservados.
