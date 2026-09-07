# KELVOR v047 — abertura e menus

A abertura, Opções, Música, Como jogar e Créditos foram reconstruídos sobre o mapa v046. A direção visual usa um vale dourado, portal, floresta e cascatas, com título dourado, texto em resolução de interface, botões maiores e movimento sutil de luz. Arte e prompt estão em `assets/menu/`.

## Comportamento

- Toque, teclado e gamepad; foco visível, confirmação única, retorno consistente e neutralização de botões de controle mantidos ao trocar de tela.
- Categorias de opções com ajustes persistidos, volume da música aplicado imediatamente e restauração que preserva o progresso da campanha.
- Sala com dez faixas, anterior/próxima, reproduzir/parar e conclusão correta de assinaturas musicais curtas. Cancelamento de áudio assíncrono ao sair ou trocar rapidamente de faixa.
- Som iniciado por interação, respeitando as permissões do navegador. Animações podem ser desligadas; preferência do sistema por menos movimento é respeitada.
- Telas longas têm rolagem. Ajuda e créditos também rolam com cima/baixo do teclado ou gamepad.
- Entrada no mapa v046 e na primeira fase preservada. Patch 118 substitui as quatro cenas antigas de menus sem executar suas rotinas de interface ou reinicialização por resize.

## Verificação de integração — 2026-09-07

- 45 testes automatizados de comportamento: 19 dos menus e 26 do mapa. Incluem confirmação dupla, fullscreen rejeitado, persistência indisponível, reset isolado, áudio redirecionado, eventos atrasados, desbloqueio de áudio sem acumular listeners, cancelamento assíncrono, gamepad e foco do diálogo com Tab mantido.
- 12 verificações do builder/servidor: integridade, repetição, arquivos indevidos, retenção de arte, HTTP e conflito de porta. Evidência local em `04_VALIDACAO/v047/BUILD_SERVER_SMOKE_V047.json`.
- Navegador Chromium: abertura inspecionada em retrato pequeno (320×568), retrato 360×740/390×844, paisagem 568×320/740×360/844×390 e desktop 1280×720. Em 1920×1080, geometria DOM confirma título sem corte; captura disponível do ambiente tem largura limitada.
- Opções, Música, Como jogar, Créditos e confirmação inspecionados em retrato; Música e Como jogar também em paisagem. Volume mudou de 100 para 49 e persistiu após recarregar; reset restaurou 100 e devolveu o foco ao botão correto. Movimento desligado foi confirmado no estilo computado.
- Reprodução, parada, próxima/anterior e fim de faixa curta exercitados no navegador. Rolagem de ajuda pelo teclado confirmada. Entrada no mapa remove a interface dos menus; primeira fase carregada. Console sem erros ou avisos na rodada observada.
- Ajustes visuais decorrentes da inspeção: título sem recorte em Full HD, todos os botões iniciais visíveis em 568×320 e controles musicais visíveis em 844×390.
- Build preserva a base v046 e gera hashes de 640 arquivos. YAML, quatro blocos Bash e dois heredocs Python do workflow tiveram sintaxe validada.

## Publicação e limites

O workflow publica esta revisão em `/v047/`, mantendo v045 na raiz e `/v046/`. O commit e o resultado final da publicação são registrados no estado local e em `04_VALIDACAO/v047/PUBLICACAO_GITHUB_V047.json`, após a conclusão do deploy.

Esta é uma revisão visual para avaliação do proprietário. Não foi atribuída nota visual 9/10 nem certificação AAA. Celular físico, áudio ouvido por uma pessoa, gamepad físico, Android TV/Google TV e navegador nativo de Smart TV ainda exigem validação nos aparelhos. O aplicativo Android TV não é produzido nesta revisão de menus.

O hash total do candidato inclui o relatório de proveniência v046, que contém horário e caminhos da máquina. Esse arquivo difere entre local e CI. O verificador confere o manifesto público e os arquivos efetivos contra a cópia local, separando explicitamente apenas essa proveniência.
