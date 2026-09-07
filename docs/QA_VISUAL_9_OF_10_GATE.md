# KELVOR — QA VISUAL / UX GATE 9.0

Regra operacional do projeto: nenhum bloco visual/UX é promovido ao próximo bloco com nota inferior a 9.0/10.

## Hard fails (qualquer um = FAIL, independentemente da média)
- navegação quebrada ou sem retorno no touch;
- botão/controle essencial fora da viewport ou sobreposto;
- crash/erro JS durante o fluxo;
- fundo/camada/objeto com artefato visual evidente;
- elemento interativo sem feedback ou função incoerente;
- regressão de física, combate, save, progressão ou critérios travados;
- qualquer reprovação de Owner QA físico no celular nas telas/fluxos que o Owner conseguiu reproduzir.

## Régua 10 pontos
1. Composição e hierarquia visual — 2.0
2. Legibilidade e contraste — 1.0
3. Responsividade mobile/desktop — 1.5
4. Clareza de interação/touch — 1.5
5. Consistência de arte/tema — 1.5
6. Animação, feedback e sensação de acabamento — 1.0
7. Ausência de artefatos/recortes/overlaps — 1.0
8. Coerência funcional/narrativa do elemento — 0.5

PASS: >= 9.0/10, nenhum hard fail e nenhuma reprovação Owner QA ainda aberta.

## Evidência visual obrigatória para UI/mobile
Para cada tela crítica do bloco, capturar e revisar no mínimo:
- 3 capturas em portrait de celular, incluindo reload/resize;
- 3 capturas em landscape de celular, incluindo reload/resize;
- 1 viewport pequena extrema;
- 1 desktop/landscape amplo.

As capturas repetidas devem confirmar que o layout continua correto após mudança de orientação, reload e nova entrada na tela. Uma única captura bonita não vale como PASS.

## Ciclo obrigatório
Implementar -> smoke técnico -> smoke visual Chrome -> capturas repetidas portrait/landscape -> nota -> corrigir -> repetir -> somente então publicar/promover.

Owner QA físico no celular é evidência superior para defeitos perceptivos que a automação não detecta. Se o Owner reprovar uma tela de forma reproduzível, a nota automática anterior é anulada e o bloco é reaberto.
