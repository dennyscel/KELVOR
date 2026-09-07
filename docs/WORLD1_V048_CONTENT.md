# Conteúdo do primeiro mundo — v048

Arquivo: `patches/120-world1-content-v048.js`. Dados determinísticos e independentes de Phaser, DOM, áudio e armazenamento. Exporta `window.PlatformerSNESV04.World1ContentV048` e `module.exports`. `levels` é congelado profundamente; `getLevel(id)` devolve cópia independente ou `null` para ID desconhecido. Consumir a cópia na simulação.

## Continuidade e extensão

A auditoria foi feita no runtime local CANDIDATO_V047 em 7 de setembro de 2026, sem aproveitar declarações antigas de QA. Os cinco nós permanecem independentes. **Toda conclusão volta ao mapa**: caminhar e escolher a fase seguinte pertence ao mapa. Nenhum conteúdo define transição direta entre fases.

| Nó | Nome v048 | Largura anterior | Largura v048 | Setores | Superfícies | Cipós | Entidades |
|---|---|---:|---:|---:|---:|---:|---:|
| W01_L01 | Trilha do Despertar | 38.200 | 42.000 | 10 | 103 | 11 | 280 |
| W01_L02 | Cascatas das Raízes | 4.800 | 24.000 | 8 | 68 | 6 | 168 |
| W01_L03 | Copas ao Luar | 5.200 | 28.000 | 8 | 88 | 9 | 187 |
| W01_SECRET | Jardim dos Pirilampos | 2.450 | 12.000 | 5 | 40 | 3 | 103 |
| W01_BOSS | O Coração da Floresta | 1.500 | 2.400 | 3 | 3 | 0 | 8 |

Fontes da extensão anterior, relativas à pasta `release_v81_campaign_presentation_rc39_v004_20260905/src`: `runtime/v56/59-w01-l01-aaa-reference-rc37.js:5`, `runtime/v29/23-w01-l02-real-level-rc6.js:5`, `runtime/v30/24-w01-l03-real-level-rc7.js:5`, `runtime/v50/53-w01-secret-bonus-rc27.js:4`, `runtime/v31/25-forest-guardian-approved-arena.js:45`. O bônus interno anterior tinha largura 760 em `runtime/v50/53-w01-secret-bonus-rc27.js:91`; a metadata do novo B01 reserva percurso mínimo de 900. O bônus continua interno, sem criar nó de campanha.

## Direção das experiências

- **L01:** inicia com passos seguros, tronco e galho; avança por ruínas, copas até y200, descanso, caminhos altos opcionais e pontes. Dez setores distinguem travessia, combate, descanso, escolha e chegada. Três sinos opcionais e bônus B02 na clareira.
- **L02:** cascatas, torres de raízes, pontes móveis e três pares de chave/porta. A passagem escondida em x13900 revela W01_SECRET. A última porta mantém chave próxima e visível.
- **L03:** floresta noturna com lanternas, intervalos de silêncio e encontros espaçados. Três sinos opcionais marcam descobertas. Bônus B03 na clareira da lagoa.
- **SECRET:** jardim luminoso com subida às copas, presente B01, chave de cristal e final próprio. Não é apenas uma sala curta de moedas.
- **BOSS:** aproximação tranquila e altar de desafio. O guardião começa adormecido. O portal está disponível sem combate; vencer é conquista opcional para platina. A proposta conserva 12 HP do guardião e 12 corações iniciais do encontro.

## Coordenadas e contrato de implementação

Todas as fases possuem altura 1500 e chão principal em y900. As superfícies usam `x` como **borda esquerda**, `y` como **topo**, `w` como largura e `h` como altura. `spawn`, `goal`, inimigos e objetos apoiados usam `y` como posição dos **pés**. Moedas, corações, chaves e sinos usam `y` como **centro da coleta**; uma moeda sobre chão comum fica em y860.

`surfaces` é a autoridade compartilhada para desenho e colisão. Não acrescentar chão invisível por baixo de lacunas. Terreno termina em y1500. Troncos e pedras não semissólidos são obstáculos reais; objetos e moedas sobre esses obstáculos são alinhados ao topo exposto. Plataformas superiores são semissólidas e possuem degraus de até80px, incluindo excursão de movimento, e espaços horizontais de até140px. Grandes subidas chegam a y200 por sequência contínua de degraus ou cipós ancorados. Um cipó aponta para `anchorSurfaceId`, tem `top` no topo real desse suporte e `bottom` no chão real.

`move` define `{axis,range,speed,phase}`: `range` é amplitude em pixels, `speed` é frequência angular em radianos por segundo e `phase` é fase inicial em radianos. Aplicar a mesma posição instantânea à arte e ao corpo. Os dados móveis não devem alterar a definição congelada.

Cada fase fornece `sectors`, `surfaces`, `vines`, `entities`, `spawn` e `goal`. Campos adicionais:

- `requiredBells:0` e `requiredDoorIds:[]`: não bloquear remotamente a saída por exploração que ficou para trás. Uma porta exige sua chave localmente; superá-la por um atalho válido não impede concluir.
- `medals`: objetivos opcionais com `{id,name,type,target,description}` e, para bônus, `bonusIds`. Tipos atuais: `complete`, `coins`, `bells`, `bonuses`, `secret`, `guardian`.
- `platinum:{name,requires,optional:true}` reúne os IDs de medalhas. Não é condição para abrir o mundo seguinte.
- `boss:{kind,hp,hearts,x,y,optional:true,startDormant:true,arena}` existe somente em W01_BOSS. Uma entidade `challenge` em x1080, `requiresAction:'Y'`, inicia o encontro por escolha do jogador.

As entidades usam IDs estáveis, `type`, `x`, `y` e propriedades próprias. `enemy.kind` é `beetle`, `bee` ou `mushroom`. `patrol` é amplitude horizontal; inimigos terrestres possuem toda a faixa apoiada antes das ravinas. A coleta superior pode conter `surfaceId` para manter referência explícita.

## Segredos, bônus e campanha

O mapa lança pelo registry com `campaignLevelId`. A cena encerra por `P.completeCampaignLevelRC4(scene,id,result)` e preserva `kelvor_campaign_rc1_v001` através das APIs RC1/RC4/RC35 existentes. A descoberta da saída secreta de L02 retorna `secretExit:true`; a campanha disponibiliza SECRET. Não inventar passagem direta para a cena secreta.

| Fase | Bônus | Posição x | Tempo | Alvo |
|---|---|---:|---:|---:|
| L01 | B02 | 16.980 | 45s | 12 luzes |
| L03 | B03 | 14.600 | 45s | 12 luzes |
| SECRET | B01 | 5.300 | 45s | 12 luzes |

Cada origem de bônus tem ao menos800px de chão contínuo adiante. O desafio é interno à fase e retorna à exploração. Persistir pelo `bonusId` individual em `worlds.W01.bonusRooms`, preservando B01 existente e os novos B02/B03; preservar `bonusRewards`. Não reutilizar uma única flag para os três bônus.

Concluir W01_BOSS sem desafiar o guardião deve completar o encontro e liberar W02 normalmente, com estado `COMPLETED`. Vitória explícita pode registrar o desafio e sua medalha; não inferir `BOSS_DEFEATED` apenas porque o portal foi alcançado. Esta distinção pertence à integração de campanha, não ao arquivo de dados.

## Verificação executada

`node --test tests/world1-content-v048.test.cjs`: **12 testes passaram**. Verificam exportação UMD sem motor, clones independentes, cinco nós, extensões, partição de setores, coordenadas, envelopes móveis, piso/objetos apoiados, exposição de coletas, gaps máximos, conectividade das plataformas, cipós ancorados, chaves antes das portas, segredo, três bônus distintos e guardião opcional.

Esses testes avaliam coerência dos dados e alcance geométrico conservador. Não são prova de diversão, integração com a física, recorte de sprites, áudio ou qualidade visual; essas verificações dependem dos patches121/122 e de execução real.
