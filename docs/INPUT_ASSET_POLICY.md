# KELVOR — Política de entrada de artifacts

1. Nunca aceitar um pacote apenas pelo nome.
2. SHA-256 deve ser verificado antes da extração.
3. O QA v005 deve continuar associado ao HERO22 v010 + CURRENT45 v003 + FINAL17 v002.
4. RC35 e RC37 são baselines preservados; nenhum workflow os sobrescreve.
5. Resultado `84_TECHNICAL_PASS_CANDIDATE` aprova os laboratórios isolados, não a campanha final.
6. O candidato vigente para campaign QA é **RC39 Presentation Integration v004**.
7. Arquivo vigente: `KELVOR_RC39_CAMPAIGN_PRESENTATION_INTEGRATION_CANDIDATE_v004_20260905.zip`.
8. SHA-256 vigente: `77e50fde0ac6fc392237616d2842814a92a6d6d392a54487b38321c339b2d36e`.
9. A auditoria v003→v004 preserva 614/614 arquivos da release v003 byte-idênticos e acrescenta somente dois runtimes v004; nenhum gameplay/asset/física/HERO22 é substituído.
10. Resultado `CAMPAIGN_TECHNICAL_PASS_CANDIDATE` ainda deixa Owner QA e mobile físico pendentes.
11. Não alterar timers, FPS gates, cobertura ou critérios para obter PASS.
12. Artifacts grandes não entram no histórico Git normal. O caminho preferido é uma **GitHub Release privada** com o ZIP exato; o workflow autentica o download com `GITHUB_TOKEN` e valida SHA-256 antes de extrair.
13. Um erro de GitHub Pages ou de hospedagem não deve ser convertido em FAIL do jogo.
14. Nenhum workflow pode declarar `LOCKED`.
