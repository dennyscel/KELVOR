# KELVOR — Política de entrada de artifacts

1. Nunca aceitar um pacote apenas pelo nome.
2. SHA-256 deve ser verificado antes da extração.
3. O QA v005 deve continuar associado ao HERO22 v010 + CURRENT45 v003 + FINAL17 v002.
4. RC35 e RC37 são baselines preservados; nenhum workflow os sobrescreve.
5. Resultado `84_TECHNICAL_PASS_CANDIDATE` aprova os laboratórios isolados, não a campanha final.
6. O candidato vigente para campaign QA é RC39 Presentation Integration v003.
7. Resultado `CAMPAIGN_TECHNICAL_PASS_CANDIDATE` ainda deixa Owner QA e mobile físico pendentes.
8. Não alterar timers, FPS gates, cobertura ou critérios para obter PASS.
9. Artifacts grandes não devem entrar no histórico Git normal; mantenha-os como assets externos versionados e protegidos por SHA-256.
