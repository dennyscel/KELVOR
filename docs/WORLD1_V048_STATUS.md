# KELVOR v048 — reconstrução do primeiro mundo

**Implementação do primeiro mundo v048 — 7 de setembro de 2026.** Página da versão: `https://dennyscel.github.io/KELVOR/v048/`. O commit servido é identificado pelo `deployment.json` desse endereço; build e publicação são verificados separadamente.

Esta versão reconstrói os cinco nós jogáveis do Mundo 01 com nova apresentação, física, controles, interações e áudio. A referência visual é a abertura v047 e o mapa já aprovados pelo usuário. “Triplo AAA” continua sendo a ambição do projeto; este registro descreve o que existe e a evidência disponível, sem atribuir nota de qualidade não medida.

## Conteúdo entregue

| Nó | Experiência | Largura anterior | Largura v048 |
| --- | --- | ---: | ---: |
| W01_L01 | Trilha do Despertar: introdução gradual, raízes, ruínas, copas, clareiras, pontes e chegada luminosa | 38.200 | 42.000 |
| W01_L02 | Cascatas das Raízes: subidas, pontes móveis, chaves locais e descoberta do caminho secreto | 4.800 | 24.000 |
| W01_L03 | Copas ao Luar: floresta noturna, lanternas, encontros espaçados e exploração pelas copas | 5.200 | 28.000 |
| W01_SECRET | Jardim dos Pirilampos: percurso próprio, copas, chave de cristal e bônus | 2.450 | 12.000 |
| W01_BOSS | O Coração da Floresta: aproximação, altar de desafio opcional e portal para concluir | 1.500 | 2.400 |

Nenhuma dessas fases foi encurtada. Em particular, L01 foi comparada à extensão real anterior de 38.200, e não a uma versão histórica mais curta. As fontes das medidas anteriores estão em [WORLD1_V048_CONTENT.md](WORLD1_V048_CONTENT.md). Todas as fases têm altura de 1.500 unidades; L01, L02, L03 e SECRET incluem rotas superiores que chegam a y=200, partindo do piso principal em y=900. O caminho principal é horizontal, com excursões verticais opcionais; não se trata de cinco fases inteiramente verticais.

Os setores alternam introdução, travessia, encontros, descanso, exploração e chegada. Troncos, caixas, pedras e plataformas têm corpos concretos; cipós são ligados a suportes existentes e podem ser escalados. Galhos caídos causam uma breve perda de velocidade sem retirar coração. Há caixas quebráveis, plataformas móveis, flores de impulso, chaves e portas correspondentes, sinos, placas, lanternas de checkpoint e coletas. Chaves abrem a porta local; uma chave ou sino deixado para trás não bloqueia remotamente a conclusão.

Besouros patrulham, cogumelos e abelhas lançam projéteis, e o jogador pode atacar, saltar sobre inimigos e se esquivar. O guardião tem avisos visuais, golpes de impacto, sementes, raízes e investida, alternando ataque e recuperação; sua segunda metade aumenta a pressão. Esses comportamentos existem na simulação, mas sua calibração de diversão ainda depende de jogar e observar pessoas reais.

## Controles, colisão e câmera

- **A:** salto de altura variável e um salto adicional no ar.
- **B:** ataque com espada; também quebra caixas.
- **X:** impulso/esquiva com intervalo de recuperação.
- **Y:** interação contextual; mantido parado, também permite defesa.
- **Direcional:** deslocamento contínuo para andar/correr e movimento vertical nos cipós. Teclado, toque e Gamepad API alimentam a mesma lógica.

No teclado, WASD/setas movem, Espaço/Z pulam, J/B atacam, K/X dão impulso, E/Y interagem e Esc pausa. O direcional de toque conserva a intensidade do deslocamento do dedo; não inventa leitura física de pressão. Gamepads usam zona morta radial, magnitude contínua e uma passagem pelo neutro ao entrar ou reconectar. Isso não equivale a certificar recursos exclusivos de um DualSense/PlayStation 5.

A física utiliza passos pequenos, tolerância curta para saltar após a borda e memória breve de um salto pressionado antes de pousar. Plataformas desenhadas e colisões usam as mesmas coordenadas; os pés são a referência vertical do jogador. Os recortes do herói possuem âncoras próprias, e tronco/caixa têm regiões sólidas separadas das folhas decorativas. As ravinas são lacunas reais, sem piso invisível por baixo. A câmera segue o personagem em ambos os eixos, com antecipação horizontal e adaptação à proporção da tela.

A pausa oferece continuar, retornar ao checkpoint ou voltar ao mapa. O checkpoint guarda posição segura, chaves, portas, sinos e descobertas locais. A restauração rejeita uma posição sem suporte válido. Ao sair de uma cena, controles, ouvintes, áudio e interface daquela cena são encerrados.

## Conclusão, segredos e guardião opcional

Chegar ao portal inicia luzes, flores, partículas e uma cadência musical de conquista. Após a celebração, a tela de conclusão apresenta coletas, sinos e bônus, com o botão **Voltar ao mapa**. Toda conclusão retorna ao mapa; nenhuma fase nova envia diretamente à fase seguinte. O avanço da campanha é registrado uma única vez.

O guardião começa adormecido. O jogador escolhe o desafio no altar usando Y, ou segue ao portal. Concluir W01_BOSS libera W02 mesmo sem combatê-lo; isso não registra uma vitória fictícia. Uma vitória real é persistida separadamente e não se perde caso uma repetição posterior use o caminho tranquilo. O encontro conserva 12 pontos de vida do guardião e 12 corações iniciais para o jogador.

L02 possui uma descoberta que libera W01_SECRET no mapa ao concluir. Os bônus internos B02 em L01, B03 em L03 e B01 em SECRET desafiam a recolher 12 luzes em 45 segundos, sem trocar a cena nem criar novos nós de campanha. Cada bônus tem sua própria flag e preserva as recompensas anteriores.

O conteúdo define objetivos de medalhas e uma platina opcional. A implementação atual persiste métricas de exploração e vitória do guardião em `kelvor_world1_v048_mastery`, e mostra o resumo na conclusão. **Uma galeria completa de medalhas e uma cerimônia própria de platina ainda não estão entregues.** A platina nunca é condição para liberar o próximo mundo.

## Arte e áudio integrados

O renderer carrega seis PNGs de [assets/world1-v048](../assets/world1-v048/):

| PNG | Uso |
| --- | --- |
| dawn-forest-v048.png | Floresta dourada com profundidade e cascatas distantes |
| moon-grove-v048.png | Bosque noturno com ruínas, flores e luar |
| hero-actions-v048.png | Oito poses do herói, com alpha e âncoras dos pés |
| enemy-sprites-v048.png | Besouro, abelha, cogumelo e guardião |
| terrain-forest-v048.png | Musgo, terra, pedras e raízes alinhados ao topo da colisão |
| props-forest-v048.png | Tronco, caixa, placa, porta, sino e flor de impulso |

Há três atlases JSON, com retângulos nomeados para herói, inimigos e objetos. Os PNGs foram preservados como gerados. A análise de alpha confirmou cobertura integral dos pixels visíveis nos recortes e ausência de corte nas suas bordas. Prompts, dimensões, SHA-256 e ressalvas estão nos arquivos de proveniência da mesma pasta. A textura de terreno utiliza repetição espelhada no renderer; não foi declarada uma textura matematicamente periódica.

Partículas, pequenas flores, cipós, lanternas, coletas e o portal final combinam essa arte com desenho Canvas. O limite de partículas é 250, os objetos fora da área visível não são desenhados e a resolução de render é limitada a 1,5 vez a densidade CSS. Esses limites reduzem custo, mas não substituem medições em dispositivos reais.

O áudio novo é uma composição procedural Web Audio: melodia, notas dedilhadas, base harmônica, baixo e percussão, com variações diurna, noturna e do desafio. A proximidade de inimigos altera a intensidade. Eventos têm pequenos motivos sonoros e o final usa uma cadência própria. Os volumes respeitam os ajustes de música/efeitos e o mute ao sair; o contexto de áudio é compartilhado. **Não é uma gravação orquestral nem uma trilha masterizada em estúdio.** A liberação do áudio continua sujeita ao gesto exigido pelo navegador.

## Preservação de escopo

Os novos registros de cena abrangem somente W01_L01, W01_L02, W01_L03, W01_SECRET e W01_BOSS. W02–W05 mantêm seus conteúdos anteriores. A abertura, os menus v047, o mapa e as APIs de campanha permanecem como base da integração; progresso de outros mundos não é substituído. Não foram criados história, aplicativo Android TV/Google TV, pacote instalável ou integração específica de uma marca de Smart TV nesta etapa.

Fontes desta entrega: `119-world1-input-v048.js`, `120-world1-content-v048.js`, `121-world1-physics-v048.js`, `123-world1-audio-v048.js` e `122-world1-scene-v048.js`, carregados nessa ordem. O build parte da base v047 verificada por manifesto. Consulte [WORLD1_V048_BUILD.md](WORLD1_V048_BUILD.md).

## Evidência de QA disponível

O relatório local `04_VALIDACAO/v048/NODE_TESTS_V048_FINAL.txt`, na pasta principal KELVOR, registra **126 testes aprovados, zero falhas ou casos ignorados**: 81 do primeiro mundo e 45 de menus/mapa. Incluem dados, controles, física, áudio e contratos de cena/campanha, chaves/portas, pés, plataformas, retorno ao mapa, guardião opcional e preservação de progresso. Dez verificações adicionais do workflow passaram.

[WORLD1_V048_NATURAL_SIMULATION.json](qa/WORLD1_V048_NATURAL_SIMULATION.json) registra cinco travessias pelo `World.step` real, iniciadas no spawn de cada fase e movidas somente por entradas. Todas chegaram a `celebrating`, com um único evento de conclusão, **zero teletransportes e zero mortes**. Houve dano em L01, L02 e L03; o encontro do guardião foi atravessado sem combate. Os hashes de conteúdo e física do relatório conferem com as fontes consultadas para este documento.

Essa simulação comprova a travessia principal no modelo; não representa uma pessoa completando todas as descobertas, uma validação visual integral ou uma vitória no desafio opcional. As durações registradas são tempo simulado de um controlador automatizado, não estimativas de tempo de jogo para o usuário.

O navegador local cobriu as cinco fases em inspeção dirigida, o cenário diurno/noturno, trecho vertical, portal e conclusão com guardião vivo, pausa e retorno ao mapa. Foram inspecionados 1280×720, 390×844, 320×568, 844×390 e 568×320; botões de ação medidos em 48px e pausa em 44px, sem overflow horizontal na menor largura. Salto por toque produziu estado aéreo, e direcional/ataque/impulso foram acionados. A bancada usa origem isolada8771 e anuncia posições dirigidas: não faz parte do build público. A sobreposição da própria barra da bancada a um botão em320px foi reconhecida e o teste de toque foi realizado em paisagem, onde ela não interfere. Console sem erros/avisos nas observações. **Medição e validação em celulares/TVs físicos continuam pendentes.** As animações do herói usam oito poses, com duas passadas de contato semelhantes; inimigos têm uma pose de base por espécie, e os gestos adicionais são feitos pelo renderer. Não há promessa de ausência universal de bugs nem nota ≥9/10 atribuída sem avaliação correspondente.

Uma verificação adicional executou RC1/RC4/RC35 e o mapa117 reais junto dos novos módulos:15 verificações confirmaram conclusão pacífica de W01_BOSS, desbloqueio de W02/L01 e lançamento pelo mapa. Evidência em [WORLD1_V048_CAMPAIGN_UNLOCK.json](qa/WORLD1_V048_CAMPAIGN_UNLOCK.json). A mensagem antiga que mandava vencer o guardião para trocar de mundo é corrigida somente emW01 pela integraçãov048.
