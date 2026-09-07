# Candidato local do mapa vivo v046

Requer Python 3.10 ou posterior. A base v045 e os workflows públicos ficam preservados. O build acrescenta os patches `116-world-map-model-v046.js` e `117-world-map-scene-v046.js` depois do patch 115 no `index.html`, mantendo o `base href`, e copia `assets/world-map/**` para a pasta de assets do release.

No PowerShell, a partir do repositório:

```powershell
python .\scripts\build_living_map.py --baseline "..\..\03_JOGO_LOCAL\BASE_V045" --output "..\..\03_JOGO_LOCAL\CANDIDATO_V046"
python .\scripts\serve_candidate.py --no-browser
```

O builder detecta `04_VALIDACAO/base_local_manifest.json` na instalação local. Use `--baseline-manifest "caminho\manifest.json"` para indicar outra localização; se informado, ele é obrigatório. Divergências da base cancelam o build. Sem manifesto disponível, o relatório identifica explicitamente que a comparação histórica não foi feita.

Na primeira execução, o destino deve ser novo: recebe uma cópia completa da base. Nas seguintes, somente `index.html`, os dois patches e os assets declarados são atualizados. Destinos sem relatório deste builder são recusados. Arquivos adicionais permanecem; arquivos antigos de arte retirados da fonte são conservados e listados em `retained_previous_outputs`. Não há limpeza recursiva. Alterações em arquivos preservados da base cancelam o rebuild.

`LIVING_MAP_BUILD_REPORT.json` registra SHA-256 da base, fontes, candidato, manifesto original e cada alteração. O próprio relatório é excluído do hash da árvore. Payload idêntico gera o mesmo hash da árvore; data e caminhos do relatório dependem do ambiente. `BUILD_VERIFIED_QA_PENDING` confirma construção e preservação, sem aprovar imagem, controles ou gameplay.

Para abrir interativamente, execute `ABRIR_MAPA_VIVO.cmd` na pasta principal KELVOR. Ele confere os hashes do candidato, abre um servidor próprio em `http://127.0.0.1:8766/` e o navegador. Mantenha a janela aberta; Ctrl+C encerra somente esse processo. Se a porta já estiver ocupada, a execução falha claramente, sem assumir controle sobre outro servidor. No terminal, `--port 8767` escolhe outra porta; `--no-browser` permite QA automatizado. A rota `/__kelvor_health` identifica a versão. O servidor limita o acesso ao computador local; não é publicação para celular ou TV.

Se faltar patch, arte, base ou candidato, corrija o caminho/arquivo indicado antes de repetir. Uma cópia inicial interrompida não ganha relatório de sucesso: use outro destino novo e preserve a pasta parcial para diagnóstico.
