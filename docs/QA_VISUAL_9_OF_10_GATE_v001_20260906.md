# KELVOR — QA VISUAL / UX GATE 9.0

Este arquivo fixa a política de promoção visual/UX do projeto KELVOR.

## Regra
Nenhum bloco visual/UX avança para o próximo bloco com nota inferior a **9,0/10**.

## Hard fails
Qualquer item abaixo reprova o bloco independentemente da média:
- navegação quebrada ou sem retorno no touch;
- controle essencial fora da viewport ou sobreposto;
- crash/erro JavaScript durante o fluxo;
- camada/fundo/objeto com artefato visual evidente;
- elemento interativo sem feedback ou com função incoerente;
- regressão de física, combate, save, progressão ou critérios travados.

## Régua de 10 pontos
- Composição e hierarquia visual: 2,0
- Legibilidade e contraste: 1,0
- Responsividade mobile/desktop: 1,5
- Clareza de interação/touch: 1,5
- Consistência de arte/tema: 1,5
- Animação, feedback e sensação de acabamento: 1,0
- Ausência de artefatos/recortes/overlaps: 1,0
- Coerência funcional/narrativa: 0,5

## Ciclo obrigatório
Implementar -> smoke técnico -> smoke visual em Chrome -> capturas críticas -> nota -> corrigir -> repetir -> publicar/promover somente com >= 9,0 e zero hard-fail.

Owner QA físico no celular continua sendo evidência superior para defeitos perceptivos que a automação não detecta.
