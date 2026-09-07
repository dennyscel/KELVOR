# Mapa vivo v046 — candidato local

Data: 2026-09-07. Estado: candidato funcional; aprovação visual >=9/10 pendente.

## Resultado

O mapa W01 agora ocupa a área de jogo. Uma apresentação panorâmica com nome animado antecede a aproximação. Kelvor caminha pelos caminhos desenhados, e a câmera acompanha os dois eixos. A interface fica sobre o mapa, com controles próprios, sem os painéis laterais antigos.

A arte nova das Planícies Verdes mede 1536x1024; prompt, origem e SHA-256 acompanham o PNG em `assets/world-map`. O mundo do runtime mede 2048x1365. Há partículas ambientais, brilho do portal e movimento discreto nas quedas d'água. O sprite do herói e suas animações vêm do atlas existente.

O módulo 116 concentra rotas, bloqueios, interpolação, enquadramento e memória de posição. O módulo 117 substitui os métodos finais da cena de mapa, conservando o preload legado e os serviços RC4/RC35 de campanha e RC25 de áudio. Nenhuma física, colisão, HP ou regra de desbloqueio de gameplay foi alterada.

## Controles

- Clique/toque em um marcador ou botão de caminho: caminhar até o destino permitido.
- Setas/WASD: escolher vizinho liberado naquela direção.
- Enter/Espaço ou Jogar: entrar na fase; durante a apresentação, aproximar.
- M ou Ver mapa: alternar panorama e foco.
- Q/E ou botões de mundo: mudar para mundo já liberado.
- Escape/Voltar: sair da apresentação/panorama ou retornar ao menu.
- Gamepad: direcional/analógico, A/Start, B, X, LB/RB. Implementação validada em VM; controle físico ainda pendente.

O save de campanha é relido antes de gravar a seleção, que só muda ao alcançar o destino. A posição por mundo usa `kelvor_world_map_v046_view`; essa chave não concede progresso. O retorno de fase tem prioridade sobre uma posição antiga. Reentrada, reconexão e recuperação de foco aguardam neutralização do gamepad.

## Verificação executada

- Build: 632 arquivos da BASE_V045 preservados; 636 arquivos no candidato, com manifesto de origem e hashes verificados.
- 26 testes Node passaram: 20 do modelo e 6 de integração VM usando os módulos reais. Cobrem bloqueios/intermediários/segredo RC35, câmera, save inválido, setas, botão de gamepad mantido, chegada, progresso concorrente, entrada de fase, retorno e cleanup.
- Navegador: entrada real pelo menu, abertura do mapa e lançamento de W01-L01 com save inicial; nenhum aviso/erro no console observado.
- Origem QA separada `127.0.0.1:8767`: fixtures explicitamente sintéticas. Confirmadas caminhada L01→L02 por teclado, L02→SECRET por botão, SECRET→L03 via L02 por marcador, câmera nos dois eixos, restauração de L03 após reload, W01→W02→W01 com retorno a L03 e apresentação do mundo.
- Origem normal `127.0.0.1:8766`: tentativa de abrir o próximo mundo bloqueada com mensagem explicativa.
- Inspeção visual responsiva: 320x568, 360x800, 390x844, 568x320, 844x390, 1024x576 e desktop 1280x720. Personagem/seleção preservados no resize. Caminhos e botões com área mínima de 44px CSS conferidos no cruzamento em 320x568.
- Capturas e árvore de acessibilidade foram inspecionadas na conversa. Não há PNGs dessas capturas exportados no repositório.

## Limites e próxima revisão

1. Não há aprovação visual >=9/10. A nova arte é candidata; falta avaliação final por critérios, evidências exportadas, medição de fluidez/carga e apreciação do usuário.
2. Somente W01 tem arte e trajetos novos alinhados ao cenário. W02–W05 usam as imagens antigas, ampliadas, e conexões provisórias. W02 abriu tecnicamente, mas sua baixa resolução é evidente. Não promover esses mapas como visualmente finalizados.
3. O retorno de fase foi testado em VM com o fluxo real da cena; a campanha não foi concluída naturalmente nesta rodada. Fixtures não são prova de vitória ou desbloqueio natural.
4. Toque foi exercitado por interação de ponteiro no navegador e responsividade por viewport. Faltam aparelhos móveis reais, gamepad físico, controle remoto, Android TV/Google TV e navegadores de Smart TV reais.
5. Menus e gameplay continuam na referência v045. Ainda há polimento de menus, chão, ravinas, portas/chaves, troncos, galhos, escadas/cipós, colisões, sprites e áudio conforme o plano master.
6. A amostragem/resolução do canvas legado ainda deve ser avaliada para manter a arte nítida em telas maiores. Não foi alterada globalmente nesta rodada.

Próxima etapa: revisar e aperfeiçoar este mapa com a direção do usuário, consolidar arte/câmera/input, depois aplicar o primeiro conjunto coerente de interações à W01-L01. A meta permanece acabamento aspiracional Triplo AAA, ainda sem novo enredo.

## Execução

Ver `LIVING_MAP_BUILD.md`. Na pasta principal local, `ABRIR_MAPA_VIVO.cmd` inicia o candidato na porta 8766. A BASE_V045 continua congelada.

O usuário autorizou publicar a v046 no GitHub para revisão pelo celular. O workflow Pages reconstrói a v045 na raiz e a v046 em `/v046/`, executando os 26 testes antes do deploy. `v046/deployment.json` identifica o commit e o hash do payload. A publicação é um candidato de teste; não altera o estado da aprovação visual acima. A confirmação operacional do deploy é registrada no estado local após a execução do workflow.
