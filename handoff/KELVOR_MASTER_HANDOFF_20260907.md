# KELVOR — MASTER HANDOFF 2026-09-07

## 1. Objetivo do projeto
Transformar o KELVOR, que ainda apresenta vários aspectos medianos/medíocres e inconsistentes, em uma experiência com **acabamento aspiracional Triplo AAA dentro das limitações técnicas, artísticas e de produção do projeto**. Não aceitar apenas “funciona”. O alvo é jogo vivo, coerente, bonito, lógico e refinado dentro e fora do gameplay.

## 2. Regra operacional obrigatória de QA
Nenhum bloco visual/UX/gameplay pode avançar somente porque o smoke técnico passou.

Fluxo obrigatório:
1. implementar em candidato;
2. smoke técnico;
3. smoke visual em Chrome real;
4. portrait + landscape + desktop + viewport pequena;
5. repetir orientação, reload, reentrada e resize;
6. revisar manualmente todas as screenshots;
7. cada tela/bloco crítico deve receber nota própria >= 9,0/10;
8. publicar no Pages;
9. fazer smoke na versão pública do Pages;
10. somente então promover e seguir.

**Hard-fail do Owner QA físico reabre o bloco mesmo que automação anterior tenha dado PASS/10.** Prints reais do celular do dono têm prioridade sobre nota automática conflitante.

## 3. Estado atual do repositório
Repositório: `dennyscel/KELVOR`
Branch: `main`
GitHub Pages: `https://dennyscel.github.io/KELVOR/`

Baseline de UI atual: cadeia responsiva v039→v045. O run de gate v045 passou:
- smoke amplo: 10,0/10 técnico;
- smoke secundário: 6/6;
- revisão visual humana interna consolidada aproximada: 9,15/10;
- v045 foi promovido ao workflow de Pages.

IMPORTANTE: essa aprovação é apenas baseline de responsividade/menus. **O design atual do mapa não deve ser tratado como visão final**, pois o Owner definiu uma evolução estrutural de mapa vivo fullscreen descrita abaixo.

## 4. Visão nova e obrigatória para o mapa-múndi
A próxima evolução do mapa deve abandonar a sensação de miniatura estática que mostra 100% do mundo o tempo todo.

Direção desejada (inspiracional, sem copiar assets): Super Mario World / Donkey Kong Country e outros overworlds clássicos vivos.

Regras:
- mapa ocupa a tela inteira;
- foco normal da câmera fica mais próximo do personagem e da região atual;
- personagem anda fisicamente pelo mapa entre nós/caminhos;
- ao andar, a câmera acompanha e revela outros setores para cima/baixo/lados conforme necessário;
- não mostrar 100% do mapa permanentemente;
- ao entrar em um mundo novo: primeiro apresentar o mapa inteiro de forma cinematográfica, com texto bonito/animado com o nome do mundo, efeitos e vida; depois aproximar/zoomar para a posição atual do personagem;
- repetir essa cerimônia ao trocar de mundo;
- mapa deve ter vida: água, folhas, nuvens, partículas, brilho, criaturas/ambientação, portais, construções e outros detalhes coerentes;
- a vida do jogo não pode existir somente no gameplay; menus, mapas e transições também precisam parecer vivos;
- efeitos devem ser lúdicos, legíveis e consistentes com a direção de arte do KELVOR;
- cada mundo pode ter linguagem ambiental própria.

## 5. Tela inicial e telas secundárias
A tela inicial melhorou muito desde v031-v045, mas continua aberta a refinamento futuro. Deve manter:
- botão de tela cheia visível no mobile;
- navegação touch clara;
- música longa coerente (nunca loop curto “clip clip clip”);
- composição própria para portrait e landscape quando necessário;
- menu vivo, não apenas painel estático.

Opções/Música/Créditos receberam refinamentos v042-v045. Botão Voltar no touch é obrigatório em todas as telas secundárias.

## 6. Fase 1 — pontos já confirmados e direção obrigatória
O bug do fundo/parallax subindo junto com o pulo foi corrigido em v032/v033: a câmera/fundo vertical deve permanecer estável.

A reconstrução W01-L01 começou em candidatos v036/v037/v038, mas foi congelada enquanto Menu/Mapa eram reabertos por Owner QA. Não publicar automaticamente esses candidatos sem nova validação completa.

Direção obrigatória de polimento para TODAS as fases:
- lógica de **chave + porta**;
- guardiões/requisito liberam uma chave física/rúnica coerente;
- chegar à porta sem chave: mensagem clara;
- com chave: animação de inserir/girar chave, feedback sonoro e abertura lúdica;
- porta não deve simplesmente sumir/translucidar sem lógica;
- abertura pode usar partículas, tremor, luz, folhas/poeira e animação, mantendo sentido visual;
- ravinas/buracos não podem ser apenas céu azul: usar profundidade, paredes, raízes, pedras, névoa/sombra e bordas coerentes;
- objetos sólidos devem ter colisão quando visualmente parecerem sólidos; objetos leves/decorativos devem ser atravessáveis;
- densidade de cenário e inimigos precisa evitar sensação de fase vazia sem virar poluição;
- trepadeiras precisam nascer de suporte lógico e ser realmente escaláveis;
- plataformas, chão e colisão precisam casar visualmente com os pés do Kelvor;
- o personagem não pode parecer flutuar acima do chão nem andar reto sobre blocos que visualmente sobem/descem sem correspondência física;
- revisar cada seção com direção de arte própria e micro-história ambiental;
- revisar transições, portas, checkpoints, pits, arenas, plataformas altas e final da fase por screenshots dedicadas.

## 7. Problema histórico de chão/colisão identificado
O chão físico antigo era essencialmente reto em Y fixo enquanto os módulos gráficos tinham alturas visuais diferentes, criando sensação de flutuação. Candidatos W01-L01 já começaram a corrigir o alinhamento visual da grama com a superfície física. Essa linha de correção deve continuar sem introduzir colisão serrilhada instável.

## 8. Estado RC39 / campanha
O projeto ainda NÃO está LOCKED.

Evidências já registradas anteriormente:
- SEAL_DAWN: PASS direcionado e natural em campanha;
- SEAL_SPIRIT: PASS direcionado e natural em terminal v027;
- SEAL_GUARDIAN: PASS isolado direcionado;
- campanha natural v027 ainda terminou em GAME OVER antes de validar Guardian naturalmente/goal;
- Owner QA final, mobile físico completo, produção/Hostinger e LOCK continuam pendentes.

Nunca confundir targeted PASS com campaign PASS. Nunca chamar workflow verde de PASS se o próprio artefato disser TIMEBOX/FAIL/GAME OVER.

## 9. Arquivos de edição
O snapshot exato do repositório contém todos os arquivos rastreados, incluindo:
- `patches/` — patches de edição, incluindo v031-v045 e candidatos W01-L01;
- `scripts/` — verificadores/smokes/tuners/diagnósticos;
- `.github/workflows/` — CI Windows, Pages, QA, diagnósticos e snapshots;
- `docs/` — histórico e regras;
- `SHA256SUMS.txt` — integridade dos arquivos rastreados.

O Drive deve conter o ZIP de snapshot do repositório e um pacote master de handoff.

## 10. Primeiras ações do próximo chat
1. Acessar Google Drive > `KELVOR/KELVOR_MASTER_HANDOFF_20260907/00_START_HERE`.
2. Ler este handoff e o prompt mestre.
3. Baixar/inspecionar o snapshot completo do repositório.
4. Verificar o GitHub HEAD atual antes de escrever para evitar concorrência.
5. Confirmar o Pages público e fazer smoke pós-deploy de v045.
6. Tratar o mapa v045 como baseline técnico, não como visão final; projetar a próxima versão do **mapa vivo fullscreen**.
7. Após fechar o bloco do mapa pelo gate >=9/10, retomar o W01-L01 Visual & Interaction Rebuild e continuar até >=9/10 antes de avançar.

## 11. Regra de segurança de escopo
Não alterar silenciosamente física, HP, hitboxes, colisões, velocidade, timing de golpes, critérios de QA ou condições de PASS para “fazer o teste passar”. Mudanças de balanceamento só quando deliberadas e documentadas. Diagnóstico pode acelerar/teleportar apenas quando explicitamente marcado como isolado e nunca deve ser promovido como campanha natural.

## 12. Filosofia de produto
Nenhum objeto visual importante deve existir sem explicar a própria função:
- porta implica chave/abertura;
- cipó implica suporte/escalada;
- buraco implica profundidade;
- degrau implica altura coerente;
- pedra grande implica massa/colisão;
- arena implica ameaça;
- recompensa implica motivo para exploração.

O objetivo final é um KELVOR com sensação de produto acabado, não protótipo funcional.
