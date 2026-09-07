# Build local do menu v047

O candidato acrescenta `118-menu-experience-v047.js` e os arquivos de `assets/menu/` ao jogo v046. O mapa vivo e todos os outros arquivos da base são preservados. O título e a descrição do documento são atualizados no `index.html` da nova pasta.

Requer Python 3.10 ou posterior; não há dependências adicionais.

No PowerShell, a partir do repositório:

```powershell
python .\scripts\build_menu_v047.py --baseline "..\..\03_JOGO_LOCAL\CANDIDATO_V046" --output "..\..\03_JOGO_LOCAL\CANDIDATO_V047"
python .\scripts\serve_menu_v047.py --no-browser
```

O endereço padrão é `http://127.0.0.1:8768/`. O launcher local `ABRIR_KELVOR_V047.cmd`, na pasta principal KELVOR, inicia o mesmo servidor e abre o navegador. É possível fornecer `--port 8769` se a porta padrão estiver ocupada. O servidor não reutiliza a porta de outro processo nem encerra servidores existentes.

O build exige um `LIVING_MAP_BUILD_REPORT.json` válido na base. Recalcula SHA-256 e tamanho de cada arquivo do payload v046, verifica o hash da árvore e rejeita arquivos ausentes, adicionais ou alterados. O próprio relatório v046 fica fora do hash do payload v046, de acordo com seu formato, mas é preservado e registrado como parte da origem no candidato v047.

Na primeira execução o destino deve ser novo. Nas seguintes, o destino precisa conter `MENU_BUILD_REPORT.json` reconhecido para a mesma base e o mesmo caminho. Só `index.html`, o patch 118 e os arquivos declarados de `assets/menu/` são atualizados. Alterações em arquivos preservados ou extras desconhecidos impedem o build. Arquivos de arte declarados por uma execução anterior permanecem no candidato caso a fonte seja retirada; aparecem em `retained_previous_outputs`. Não há remoção recursiva de arquivos ou pastas.

O relatório v047 contém inventários completos da base e do candidato, hashes SHA-256 das fontes e da árvore, lista de alterações e confirmação de que a base permaneceu idêntica durante o build. O próprio `MENU_BUILD_REPORT.json` fica fora do hash da árvore v047. O servidor revalida o payload completo antes de abrir a porta; edições posteriores ao build exigem executar o builder novamente.

`BUILD_VERIFIED_QA_PENDING` comprova integridade do build. A leitura dos menus, suas funções, animações, áudio e funcionamento nos dispositivos dependem de testes separados. Este script não publica no GitHub Pages e não altera os workflows de publicação.
