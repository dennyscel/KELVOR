# Build local do primeiro mundo v048

O candidato parte de `CANDIDATO_V047` com `MENU_BUILD_REPORT.json` válido. Preserva a abertura, os menus, o mapa e os arquivos existentes; acrescenta os módulos do primeiro mundo e copia integralmente `assets/world1-v048/` para os assets do runtime. O builder não presume quantidade fixa de arquivos nem comprova uso visual de um asset apenas por copiá-lo.

Requer Python 3.10 ou posterior, sem dependências adicionais. Os helpers de integridade vêm de `build_menu_v047.py`; o servidor utiliza a classe local de `serve_menu_v047.py`. Mantenha os quatro scripts juntos na pasta `scripts/`.

No PowerShell, a partir do repositório:

```powershell
python .\scripts\build_world1_v048.py --baseline "..\..\03_JOGO_LOCAL\CANDIDATO_V047" --output "..\..\03_JOGO_LOCAL\CANDIDATO_V048"
python .\scripts\serve_world1_v048.py --no-browser
```

O endereço padrão é `http://127.0.0.1:8770/`. O launcher local `ABRIR_KELVOR_V048.cmd`, na pasta principal KELVOR, inicia o mesmo servidor e abre o navegador. Use `--port 8771` se a porta estiver ocupada. O servidor não reaproveita a porta de outro processo e não encerra servidores existentes. `/__kelvor_health` informa `kelvor-world1-v048` e `local_only: true`.

O `index.html` mantém o `base href` local da versão anterior. Depois do patch 118, os módulos são carregados nesta ordem intencional:

1. `119-world1-input-v048.js`
2. `120-world1-content-v048.js`
3. `121-world1-physics-v048.js`
4. `123-world1-audio-v048.js`
5. `122-world1-scene-v048.js`

O áudio precede a cena que o consome. O título fica **KELVOR — O primeiro mundo floresce (v048)**. Patches ausentes, repetidos no HTML, pasta de assets vazia, links ou junções nas fontes verificadas impedem o build antes de criar um candidato novo.

O build recalcula SHA-256 e tamanho de todos os arquivos do payload v047 e confere o hash da árvore contra o manifesto. Arquivos adicionais, ausentes ou alterados na base são rejeitados. O relatório v047 fica fora do hash de seu próprio payload, mas é preservado e registrado no candidato v048.

Na primeira execução, o destino deve ser novo. Nas seguintes, precisa conter `WORLD1_BUILD_REPORT.json` reconhecido para a mesma base e o mesmo caminho. Só `index.html`, os cinco patches e os arquivos declarados de `assets/world1-v048/` são atualizados. Alterações em arquivos preservados ou extras desconhecidos impedem a reconstrução. Outputs de uma execução anterior cuja fonte foi retirada permanecem no candidato e aparecem em `retained_previous_outputs`. Não há remoção recursiva de arquivos ou pastas.

`WORLD1_BUILD_REPORT.json`, com `build_id: kelvor-world1-v048`, registra os inventários completos, a ordem dos módulos, os hashes das fontes e da árvore, as alterações declaradas e a confirmação de que a base ficou idêntica durante o build. O próprio relatório fica fora do hash v048. O servidor verifica o payload completo antes de abrir a porta; edições após o build exigem reconstrução.

`BUILD_VERIFIED_QA_PENDING` comprova integridade dos arquivos. Arte, áudio, colisões, legibilidade, diversão e dispositivos reais exigem QA separado. Este builder não adiciona atalhos de campanha, parâmetros de QA, fontes tipográficas ou arquivos fictícios e não publica no GitHub Pages.

O workflow `.github/workflows/pages-deploy.yml` executa os testes Node de mapas, menus e `tests/world1*.test.cjs` antes de publicar. Constrói v046, v047 e v048 em pastas temporárias irmãs, sempre antes de acrescentar `deployment.json`. Assim os metadados da publicação não contaminam a base assinada por cada manifesto. O site conserva a raiz v045, `/v046/`, `/v047/` e acrescenta `/v048/`.

O verificador local `04_VALIDACAO/v048/verify_publication.py`, na pasta principal KELVOR, é executado somente depois da publicação com `--commit` seguido do SHA completo. Confere o payload local inteiro, metadados do commit, inventário público, os cinco módulos, `index.html`, todos os arquivos de `assets/world1-v048/` (incluindo as seis imagens e seus atlas) e os índices preservados de v045/v046/v047. Os relatórios de proveniência v046 e v047 têm verificações separadas de bytes e inventários: horários e caminhos diferentes entre o computador e o CI não são tratados como mudanças de gameplay. A ferramenta usa somente HTTP de leitura; não publica nem altera o jogo.
