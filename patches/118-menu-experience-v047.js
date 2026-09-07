(function (P) {
  'use strict';
  const S=P.GameSettingsV10, A=P.AudioServiceRC25, AUDIO_UNLOCK_REQUESTS=new WeakSet();
  const SCENES={home:'MainMenuSceneV10',options:'OptionsSceneV10',music:'MusicPlayerSceneV10',credits:'CreditsSceneV10'};
  const TRACKS=[
    {cue:'MUS_P1_EXPLORE_A',name:'O despertar da aventura',detail:'Planícies Verdes · exploração',loop:true},
    {cue:'MUS_P1_BOSS_LOOP_A',name:'Diante do guardião',detail:'Planícies Verdes · batalha',loop:true},
    {cue:'MUS_GLOBAL_TITLE',name:'O chamado de Kelvor',detail:'Abertura · assinatura musical',loop:false},
    {cue:'MUS_GLOBAL_WORLD_MAP',name:'Novos caminhos',detail:'Mapa · assinatura musical',loop:false},
    {cue:'MUS_GLOBAL_VICTORY_STINGER',name:'Uma pequena grande vitória',detail:'Celebração',loop:false},
    {cue:'MUS_GLOBAL_TRANSITION',name:'Além do horizonte',detail:'Passagem de mundo',loop:false},
    {cue:'MUS_GLOBAL_GAME_OVER',name:'Tentar outra vez',detail:'Fim de uma tentativa',loop:false},
    {cue:'MUS_P1_BOSS_INTRO',name:'Um desafio se aproxima',detail:'Encontro com o guardião',loop:false},
    {cue:'MUS_P1_BOSS_DEFEAT',name:'O guardião descansa',detail:'Vitória sobre o guardião',loop:false},
    {cue:'MUS_P1_CLEAR',name:'Caminho conquistado',detail:'Conclusão de fase',loop:false}
  ];
  const OPTIONS={
    audio:{name:'Áudio',icon:'music',note:'Ajuste o volume enquanto ouve.',rows:[
      ['masterVolume','Volume geral','Todos os sons do jogo.',0,100],['musicVolume','Música','Melodias da aventura.',0,100],['sfxVolume','Efeitos','Saltos, encontros e ações.',0,100],['uiVolume','Sons dos menus','Toques suaves para cada escolha.',0,100],['ambienceVolume','Ambiente','Volume reservado aos ambientes sonoros.',0,100],['muteWhenUnfocused','Silenciar ao sair','Pausa o som enquanto o jogo fica em segundo plano.']]},
    play:{name:'Jogo',icon:'compass',note:'Escolha como começar sua jornada.',rows:[['showControlHints','Dicas de controle','Exibe as orientações disponíveis nas fases.'],['fullscreenOnPlay','Tela cheia ao jogar','Quando o navegador do celular permitir.'],['autoGameplay','Demonstração automática','Ativa o modo automático disponível nas fases.']]},
    touch:{name:'Toque',icon:'hand',note:'O layout dos controles é aplicado na próxima fase.',rows:[['touchControls','Controles na tela','Automático detecta celulares e tablets.',['auto','on','off']],['leftHanded','Modo para canhotos','Inverte a posição dos controles de toque.'],['joystickSize','Tamanho do direcional','Ajuste a área do controle.',80,130],['actionButtonScale','Tamanho dos botões','Ajuste os botões de ação.',80,130],['joystickOpacity','Visibilidade dos controles','Intensidade dos controles sobre a fase.',35,100],['haptics','Vibração no toque','Quando o aparelho oferecer suporte.']]},
    comfort:{name:'Conforto',icon:'sun',note:'Deixe a experiência confortável para você.',rows:[['menuMotion','Animações dos menus','Movimento de luz, partículas e transições.'],['screenShake','Movimento de impacto','Tremor da câmera nas ações do jogo.'],['reducedFlashes','Reduzir clarões','Diminui os flashes disponíveis nas fases.']]}
  };
  const ICONS={arrow:'M5 12h14m-6-6 6 6-6 6',back:'m14 5-7 7 7 7',music:'M9 18V5l11-2v13M9 7l11-2M9 18c0 2-6 3-6 0s6-3 6 0Zm11-2c0 2-6 3-6 0s6-3 6 0Z',gear:'m9 3 6 0 1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',compass:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM15 9l-2 4-4 2 2-4Z',book:'M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15',sound:'m4 9 4 0 5-4v14l-5-4H4Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14',screen:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',hand:'M8 12V5a2 2 0 0 1 4 0v7-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v9c0 8-10 8-13 3l-4-5c-1-2 2-3 3-1l2 2',play:'m9 5 11 7-11 7Z',stop:'M6 6h12v12H6Z',next:'m5 5 10 7-10 7ZM19 5v14',previous:'m19 5-10 7 10 7ZM5 5v14',heart:'M12 21 3 12C-2 4 8-1 12 6c4-7 14-2 9 6Z',check:'m5 12 4 4 10-10'};
  const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name]||ICONS.compass}"/></svg>`;
  const button=(action,label,ico='',extra='')=>`<button type="button" data-action="${action}" ${extra}>${ico?icon(ico):''}<span>${label}</span></button>`;
  const escape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function style(){
    if(document.getElementById('kelvor-menu-style-v047'))return;
    const el=document.createElement('style');el.id='kelvor-menu-style-v047';
    el.textContent=`
      .km47{position:absolute;inset:0;z-index:210;isolation:isolate;overflow:hidden;color:#f9f0d9;background:#081c20;font:400 16px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;--gold:#f7dda5;--muted:#bfcdc7;--line:#e8d6ab36;--pad:clamp(16px,3.6vw,60px);touch-action:manipulation}
      .km47 *{box-sizing:border-box}.km47 [hidden]{display:none!important}.km47 button,.km47 select,.km47 input{font:inherit}.km47 button{cursor:pointer;color:inherit;border:1px solid var(--line);border-radius:13px;background:#0e2929db;min-height:48px;padding:12px 18px;display:inline-flex;gap:11px;align-items:center;justify-content:center;transition:background .18s,border-color .18s,transform .18s;touch-action:manipulation}
      .km47 button:hover{background:#24403bdc;border-color:#eddaa681}.km47 button:active{transform:translateY(1px)}.km47 button:disabled{cursor:default;opacity:.5}.km47 :focus-visible{outline:3px solid #ffe3a2;outline-offset:4px}.km47 svg{width:22px;height:22px;flex-shrink:0}
      .km47-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:-5;animation:km47-world 36s ease-in-out infinite alternate;pointer-events:none}
      .km47-shade{position:absolute;inset:0;z-index:-4;background:linear-gradient(90deg,#061b20c9 0%,#061b2060 42%,transparent 78%),linear-gradient(0deg,#051617bf,transparent 32%,#05161718);pointer-events:none}
      .km47[data-screen]:not([data-screen="home"]) .km47-shade{background:linear-gradient(90deg,#061b20e8,#061b20a8),linear-gradient(0deg,#061b2080,transparent)}
      .km47-top{height:88px;position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px var(--pad);padding-top:max(12px,env(safe-area-inset-top));}
      .km47-brand{font:700 24px/1 Georgia,serif;letter-spacing:.13em;color:#f3dcab;text-shadow:0 2px 10px #011}.km47-top .km47-brand{display:flex;gap:12px;align-items:center}.km47-top .km47-brand svg{width:18px;height:18px}.km47-top-actions{display:flex;gap:8px}.km47-top-actions button{background:#0b2428a8;min-height:44px;font-size:13px;padding:10px 13px;border-radius:30px}.km47-top-actions svg{width:18px;height:18px}
      .km47-main{height:calc(100% - 132px);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#e2c79361 #09201d;touch-action:pan-y;padding:0 var(--pad) 24px;position:relative}
      .km47-home{min-height:100%;display:flex;align-items:center;padding-left:clamp(0px,3vw,52px);padding-bottom:20px}.km47-home-copy{width:min(460px,45vw);animation:km47-reveal .8s ease-out both}
      .km47-overline{font-weight:700;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#e1c793;display:flex;align-items:center;gap:12px;margin:0 0 13px}.km47-overline:before{content:'';width:32px;height:1px;background:#e7ce95a8}
      .km47-logo{font:700 clamp(64px,7.8vw,106px)/.93 Georgia,serif;letter-spacing:-.055em;margin:0 0 14px;filter:drop-shadow(0 5px 5px #031819);background:linear-gradient(#fff4d5 8%,#f9dd9b 45%,#d2a65d 80%,#e6cc8c);color:#f4db9b;background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .km47-tagline{font:400 clamp(21px,2.1vw,32px)/1.3 Georgia,serif;color:#f9ebc9;margin:0 0 28px;text-shadow:0 2px 8px #001c16}.km47-primary{width:100%;min-height:72px!important;background:linear-gradient(110deg,#f9e4b6,#e7c686)!important;color:#193128!important;border-color:#fff0c7!important;justify-content:space-between!important;font-weight:700!important;font-size:19px!important;box-shadow:0 8px 30px #011a1660,inset 0 1px 0 #fff8d1;position:relative;overflow:hidden}
      .km47-primary:hover{background:linear-gradient(110deg,#fff0cf,#f4d79e)!important;transform:translateY(-2px)}.km47-primary .km47-start-copy{display:block;text-align:left}.km47-primary small{display:block;font-size:11px;font-weight:500;opacity:.8;margin-top:3px}.km47-primary svg{width:25px;height:25px}
      .km47-home-nav{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}.km47-home-nav button{justify-content:flex-start;min-height:54px;font-size:14px;background:#0b2528c4}.km47-home-nav svg{color:#e5d1a4;width:20px;height:20px}
      .km47-world-caption{position:absolute;right:var(--pad);bottom:20px;text-align:right;color:#fbecd0;text-shadow:0 2px 6px #061713;font:400 20px/1.5 Georgia,serif}.km47-world-caption small{display:block;font:700 10px/1.5 system-ui;letter-spacing:.2em;text-transform:uppercase;color:#ead6ab}
      .km47-footer{height:44px;padding:0 var(--pad) max(9px,env(safe-area-inset-bottom));display:flex;gap:12px;align-items:center;justify-content:space-between;color:#b3c5be;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:linear-gradient(0deg,#04171f8c,transparent)}
      .km47-footer span:last-child{color:#ead7ae}.km47-section{width:min(100%,1050px);margin:18px auto 0;animation:km47-reveal .35s ease-out both}.km47-lead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.km47-lead h1{font:400 clamp(36px,4vw,58px)/1.1 Georgia,serif;margin:0 0 8px;color:#fff0cf}.km47-lead p{margin:0;color:#c5d5cc;font-size:15px}.km47-back{background:transparent!important}
      .km47-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 18px}.km47-tabs button{font-size:14px;padding:10px 16px;min-height:46px}.km47-tabs button[aria-selected="true"]{background:#f0d7a3;color:#183029;border-color:#ffe4b3}.km47-tabs svg{width:18px;height:18px}
      .km47-card{background:linear-gradient(145deg,#0e2c2bef,#081e23ef);border:1px solid var(--line);border-radius:20px;padding:10px 26px;box-shadow:0 16px 60px #031b1744}.km47-row{display:flex;gap:24px;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid #d8d7b51c;min-height:88px}.km47-row:last-child{border-bottom:0}.km47-row-title{display:block;font-size:16px;font-weight:650;color:#f6efd9}.km47-row small{display:block;font-size:12px;color:#bccdc5;margin-top:3px;max-width:420px}.km47-range{display:flex;align-items:center;gap:12px;flex:0 0 290px}.km47-range output{min-width:42px;font-size:14px;color:#f1d99e;text-align:right;font-variant-numeric:tabular-nums}.km47 input[type="range"]{width:100%;min-height:44px;accent-color:#e9cf97;cursor:pointer;touch-action:pan-x}.km47 input[type="range"]::-webkit-slider-thumb{min-width:22px;min-height:22px}
      .km47-toggle{min-width:86px;min-height:46px!important;font-size:13px!important;white-space:nowrap}.km47-toggle[aria-checked="true"]{border-color:#dbce8e99;background:#294b38}.km47-toggle i{width:11px;height:11px;border-radius:100%;background:#84978e;display:block}.km47-toggle[aria-checked="true"] i{background:#ead894;box-shadow:0 0 10px #ecde8d44}.km47 select{min-height:46px;color:#f7edd5;background:#14332e;border:1px solid #dfd3aa70;border-radius:10px;padding:8px 30px 8px 12px;max-width:180px}
      .km47-option-foot{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-top:16px;color:#c4d3ca;font-size:12px}.km47-option-foot button{font-size:12px;min-height:44px;background:#102923;white-space:nowrap}.km47-saved{color:#d2dcba}.km47-note{font-size:12px;color:#c2d3c6;margin:0 0 15px}
      .km47-music-grid{display:grid;grid-template-columns:minmax(250px,.8fr) minmax(320px,1.2fr);gap:28px}.km47-player{align-self:start;border-radius:22px;background:linear-gradient(150deg,#153e35e8,#071f29e8);border:1px solid var(--line);padding:26px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:360px}.km47-orb{width:145px;height:145px;position:relative;border:1px solid #dac68c88;border-radius:50%;margin:0 0 20px;display:grid;place-items:center;background:radial-gradient(circle,#d9c47c20,transparent 69%);box-shadow:0 0 40px #a1cf8020,inset 0 0 35px #aad6970e}.km47-orb:before,.km47-orb:after{content:'';position:absolute;inset:13px;border:1px solid #e6d19844;border-radius:50%}.km47-orb:after{inset:28px;border-style:dashed;animation:km47-spin 25s linear infinite;animation-play-state:paused}.km47[data-playing="true"] .km47-orb:after{animation-play-state:running}.km47-orb svg{width:46px;height:46px;color:#f2dda3}.km47-player h2{font:400 27px/1.2 Georgia,serif;margin:0 0 10px}.km47-player p{font-size:12px;color:#c0d2c5;margin:0}.km47-transport{display:flex;gap:10px;align-items:center;margin:22px 0 14px}.km47-transport button{min-width:48px;padding:12px}.km47-transport .km47-play{background:#efd59b;color:#173427;width:60px;height:60px;border-radius:50%}.km47-player .km47-range{flex:auto;width:100%;max-width:250px}.km47-track-list{border:1px solid var(--line);border-radius:20px;overflow:hidden;background:#0b2428de}.km47-track{width:100%;text-align:left;justify-content:flex-start!important;border:0!important;border-radius:0!important;min-height:66px!important;background:transparent!important;border-bottom:1px solid #d8d7b517!important;padding:12px 17px!important;gap:15px!important}.km47-track[aria-pressed="true"]{background:#f2df9e15!important}.km47-track:hover{background:#2447388c!important}.km47-track-number{font-size:12px;color:#e0c78f;font-variant-numeric:tabular-nums}.km47-track strong{display:block;font-size:14px;font-weight:600}.km47-track small{display:block;font-size:11px;color:#b8cdc1;margin-top:3px}.km47-track svg{margin-left:auto;width:16px;height:16px}
      .km47-controls-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.km47-instruction{padding:24px;border:1px solid var(--line);background:#0e2b2bec;border-radius:20px}.km47-instruction>svg{width:30px;height:30px;color:#e4ce97;margin-bottom:15px}.km47-instruction h2{font:400 25px/1.2 Georgia,serif;margin:0 0 16px}.km47-instruction dl{margin:0}.km47-instruction dt{font-size:14px;color:#f4e4bc;margin-top:14px;font-weight:650}.km47-instruction dd{margin:4px 0 0;font-size:13px;color:#c2d2c6;line-height:1.55}.km47-controls-note{padding:18px 20px;color:#d0dbcc;border-left:2px solid #e7cb8b;font-size:13px;margin-top:22px;background:#0c252c9c}
      .km47-credits{max-width:670px;text-align:center;margin:24px auto;padding:38px 35px;background:linear-gradient(140deg,#16372be6,#09222be6);border:1px solid var(--line);border-radius:24px}.km47-crest{width:66px;height:66px;display:grid;place-items:center;color:#ead29d;border:1px solid #dbc58b6e;transform:rotate(45deg);margin:4px auto 34px}.km47-crest svg{transform:rotate(-45deg);width:30px;height:30px}.km47-credits .km47-overline{justify-content:center}.km47-credits .km47-overline:before{display:none}.km47-credits h2{font:400 clamp(28px,4vw,46px)/1.12 Georgia,serif;margin:12px 0 14px;color:#fff0cc}.km47-credits p{color:#ccd8cb;font-size:14px;line-height:1.7}.km47-credit-rule{width:60px;height:1px;background:#dfc68a7a;margin:26px auto}.km47-credits .km47-thanks{font:400 23px/1.4 Georgia,serif;color:#f1dca8}.km47-credit-engine{font-size:11px!important;color:#9ebaae!important}
      .km47-modal{position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:#031619d9;backdrop-filter:blur(5px)}.km47-dialog{width:min(420px,100%);background:#12332e;border:1px solid #ead49877;border-radius:22px;padding:26px;box-shadow:0 20px 80px #0008}.km47-dialog h2{font:400 28px Georgia;margin:0 0 12px}.km47-dialog p{font-size:14px;color:#c8d5c7;margin:0 0 20px}.km47-dialog-actions{display:flex;gap:10px;justify-content:flex-end}.km47-dialog-actions button:last-child{background:#edcf96;color:#17342a}.km47-toast{position:absolute;bottom:62px;left:50%;transform:translateX(-50%);z-index:30;padding:12px 18px;border-radius:12px;border:1px solid #e5d1a26e;background:#0d302cf5;color:#f5edce;max-width:90%;font-size:13px;text-align:center}
      .km47-motes{position:absolute;inset:0;pointer-events:none;z-index:-2;overflow:hidden}.km47-motes i{position:absolute;width:3px;height:3px;border-radius:50%;background:#f2d99c;box-shadow:0 0 9px #f6eab789;animation:km47-float 10s ease-in-out infinite;opacity:0}
      .km47[data-motion="off"] *,.km47[data-motion="off"] *:before,.km47[data-motion="off"] *:after{animation:none!important;transition:none!important}.km47[data-motion="off"] .km47-motes{display:none}
      @keyframes km47-world{from{transform:scale(1)}to{transform:scale(1.025)}}@keyframes km47-reveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes km47-spin{to{transform:rotate(360deg)}}@keyframes km47-float{0%,100%{transform:translate(0,20px);opacity:0}35%,70%{opacity:.5}90%{transform:translate(25px,-100px);opacity:0}}
      @media(min-width:1600px){.km47-home-copy{width:530px}.km47-logo{font-size:122px}.km47-primary{min-height:80px!important}.km47-home-nav button{min-height:64px;font-size:17px}.km47-section{max-width:1160px}.km47-row{min-height:100px}.km47-row-title{font-size:18px}}
      @media(max-width:700px){.km47{--pad:20px}.km47-top{height:70px}.km47-top .km47-brand{font-size:20px}.km47-top-actions button{padding:10px;gap:7px}.km47-top-actions button span{display:none}.km47-main{height:calc(100% - 108px);padding-bottom:22px}.km47-footer{height:38px;font-size:8px;letter-spacing:.04em}.km47-bg{object-position:74% center}.km47-shade{background:linear-gradient(0deg,#041d23f2 2%,#061b208a 30%,#061b201f 62%,#03171fd1),linear-gradient(90deg,#071d2420,#071d2420)}.km47-home{padding:0;display:flex;align-items:stretch}.km47-home-copy{width:100%;display:flex;flex-direction:column;min-height:100%;padding-top:22px}.km47-logo{font-size:clamp(66px,17.8vw,116px);text-align:center;margin-bottom:10px}.km47-home .km47-overline{justify-content:center;font-size:9px;letter-spacing:.22em}.km47-home .km47-overline:before{display:none}.km47-tagline{text-align:center;font-size:22px;margin-bottom:20px}.km47-home-actions{margin-top:auto;padding-top:65px}.km47-primary{min-height:66px!important;font-size:18px!important}.km47-home-nav button{min-height:52px;font-size:14px;padding:10px 13px;gap:8px}.km47-home-nav{gap:8px;margin-top:10px}.km47-world-caption{display:none}.km47-lead{margin-bottom:18px;gap:10px}.km47-lead h1{font-size:38px}.km47-lead p{font-size:13px}.km47-section{margin:12px auto 0}.km47-tabs{gap:5px;display:grid;grid-template-columns:repeat(4,1fr)}.km47-tabs button{font-size:12px;padding:10px 6px;gap:5px}.km47-tabs svg{display:none}.km47-card{padding:4px 17px;border-radius:17px}.km47-row{gap:12px;padding:17px 0;flex-wrap:wrap;min-height:84px}.km47-row>label,.km47-row>div:first-child{flex:1;min-width:150px}.km47-row-title{font-size:15px}.km47-row small{font-size:11px}.km47-range{flex:1 0 100%;gap:12px}.km47-toggle{min-width:80px;padding:10px!important}.km47-option-foot{align-items:flex-start;flex-direction:column}.km47-music-grid{grid-template-columns:1fr;gap:16px}.km47-player{min-height:0;padding:22px 18px}.km47-orb{width:104px;height:104px;margin-bottom:16px}.km47-orb svg{width:33px;height:33px}.km47-player h2{font-size:24px}.km47-transport{margin:18px 0 12px}.km47-player .km47-range{width:100%;flex:auto;max-width:100%}.km47-track{min-height:66px!important}.km47-controls-grid{grid-template-columns:1fr}.km47-instruction{padding:22px}.km47-credits{padding:29px 22px;margin:16px auto}.km47-credits .km47-overline{font-size:9px;letter-spacing:.16em}.km47-credit-rule{margin:20px auto}.km47-credits .km47-thanks{font-size:21px}}
      @media(max-height:560px) and (orientation:landscape){.km47{--pad:20px}.km47-top{height:56px}.km47-main{height:calc(100% - 86px);padding-bottom:12px}.km47-footer{height:30px;font-size:8px}.km47-home{padding:0;align-items:center}.km47-home-copy{width:min(430px,52vw);padding:0;display:block}.km47-logo{font-size:clamp(50px,10vw,85px);text-align:left;margin-bottom:5px}.km47-home .km47-overline{justify-content:flex-start;font-size:8px;margin-bottom:6px}.km47-tagline{text-align:left;font-size:18px;margin-bottom:12px}.km47-home-actions{margin-top:0;padding-top:0}.km47-primary{min-height:52px!important;font-size:16px!important;padding:9px 14px!important}.km47-primary small{display:none}.km47-home-nav{gap:6px;margin-top:7px}.km47-home-nav button{min-height:44px;font-size:12px;padding:8px 11px}.km47-world-caption{display:block;font-size:16px}.km47-section{margin-top:8px}.km47-lead{margin-bottom:14px}.km47-lead h1{font-size:32px}.km47-lead p{font-size:12px}.km47-music-grid{grid-template-columns:minmax(200px,.8fr) minmax(230px,1.2fr)}.km47-player{padding:14px;min-height:0}.km47-orb{display:none}.km47-player h2{font-size:23px;margin-bottom:6px}.km47-transport{margin:10px 0 8px}.km47-transport .km47-play{width:48px;height:48px}.km47[data-screen="music"] .km47-lead .km47-overline,.km47[data-screen="music"] .km47-lead p:not(.km47-overline){display:none}.km47[data-screen="music"] .km47-lead{margin-bottom:10px}.km47-controls-grid{grid-template-columns:repeat(3,1fr)}.km47-instruction{padding:17px}.km47-instruction h2{font-size:22px}}
      @media(max-width:360px){.km47{--pad:14px}.km47-home-copy{padding-top:8px}.km47-home-actions{padding-top:40px}.km47-home-nav button{font-size:12px}.km47-home-nav svg{width:18px}.km47-top .km47-brand{font-size:18px}.km47-tabs button{font-size:11px}.km47-row-title{font-size:14px}.km47-top-actions button{min-width:44px}.km47-tagline{font-size:21px}}
      @media(max-height:360px) and (orientation:landscape){.km47[data-screen="home"] .km47-main{padding-bottom:0}.km47-home .km47-overline{display:none}.km47-logo{font-size:50px;margin-bottom:4px}.km47-tagline{font-size:16px;margin-bottom:8px}.km47-primary{min-height:46px!important}.km47-home-nav{margin-top:6px;gap:6px}}
      @media(prefers-reduced-motion:reduce){.km47 *,.km47 *:before,.km47 *:after{animation:none!important;transition:none!important}}
    `;document.head.appendChild(el);
  }
  class MenuController {
    constructor(scene,screen){
      this.scene=scene;this.screen=screen;this.alive=true;this.busy=false;this.tab='audio';this.track=0;this.playing=false;this.audioSeq=0;this.soundRef=null;this.padNeutral=false;this.padButtons=[];this.padNext=0;this.time=0;this.lastMaster=100;
      this.abort=new AbortController();style();document.getElementById('kelvor-menu-v047')?.remove();
      const root=document.createElement('section');root.className='km47';root.id='kelvor-menu-v047';root.setAttribute('aria-label','KELVOR — menus');this.root=root;
      root.innerHTML=`<img class="km47-bg" src="./assets/menu/title-world-v047.png" alt="" decoding="async" fetchpriority="high"><div class="km47-shade"></div><div class="km47-motes" aria-hidden="true">${Array.from({length:20},(_,i)=>`<i style="left:${8+(i*29)%88}%;top:${18+(i*17)%78}%;animation-delay:-${i*.7}s;animation-duration:${8+i%5}s"></i>`).join('')}</div><header class="km47-top"></header><main class="km47-main"></main><footer class="km47-footer"><span>Dennys Pavanelli</span><span>Uma aventura em cinco mundos</span></footer><div class="km47-modal" hidden></div><div class="km47-toast" role="status" hidden></div>`;
      (document.getElementById('platformer-snes-v04-root')||document.body).appendChild(root);
      this.main=root.querySelector('main');this.render();this.bind();
      this.main.querySelector(screen==='home'?'[data-action="play"]':screen==='music'?'[data-action="toggleTrack"]':'button,input,select')?.focus?.({preventScroll:true});
      if(screen==='credits')root.querySelector('[data-action=back]')?.focus?.({preventScroll:true});
      scene.cameras?.main?.setBackgroundColor('#081c20');
      if(screen==='music')A?.stopMusic();else this.titleMusic();
      root.querySelector('.km47-bg').addEventListener('error',()=>this.toast('A paisagem não carregou. Você pode continuar navegando.'),{signal:this.abort.signal});
      window.__KELVOR_MENU_V047__=this;
    }
    motion(){return S.get('menuMotion')!==false&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
    readyAudio(){const s=this.scene.sound;return !!s&&!s.locked&&(!s.context||s.context.state==='running');}
    unlock(){
      try{const sound=this.scene.sound;if(sound?.locked&&!AUDIO_UNLOCK_REQUESTS.has(sound)){AUDIO_UNLOCK_REQUESTS.add(sound);sound.unlock?.();}const context=sound?.context;const result=context&&context.state!=='running'?context.resume?.():undefined;return Promise.resolve(result).catch(()=>{});}catch(_){return Promise.resolve();}
    }
    titleMusic(){if(this.alive&&this.screen!=='music'&&this.readyAudio()&&S.get('masterVolume')>0)A?.playMusic(this.scene,'MUS_GLOBAL_TITLE',true,{gain:.54});this.updateSound();}
    ui(cue='UI_CONFIRM'){if(this.readyAudio())A?.play(this.scene,cue,{gain:.35,cooldown:80});}
    applyAudio(){if(A?.currentMusic&&A.currentCue)A.currentMusic.setVolume?.(A.volume(A.currentCue,this.screen==='music'?.72:.54));if(this.scene.sound)this.scene.sound.mute=!!S.get('muteWhenUnfocused')&&document.hidden;this.updateSound();}
    updateSound(){const b=this.root.querySelector('[data-action="sound"]');if(!b)return;const on=S.get('masterVolume')>0&&this.readyAudio();b.setAttribute('aria-label',on?'Silenciar som':'Ativar som');b.title=on?'Silenciar som':'Ativar som';b.querySelector('span').textContent=on?'Som ligado':'Ativar som';b.setAttribute('aria-pressed',String(on));}
    render(){
      this.root.dataset.screen=this.screen;this.root.dataset.motion=this.motion()?'on':'off';this.root.dataset.playing=String(this.playing);
      document.documentElement.dataset.kelvorScreen=this.screen==='home'?'main-menu':this.screen==='music'?'music-player':this.screen;
      const top=this.root.querySelector('header');
      top.innerHTML=`${this.screen==='home'?`<div class="km47-brand">${icon('compass')}<span>UMA NOVA JORNADA</span></div>`:button('back','Voltar','back','class="km47-back"')}<div class="km47-top-actions">${button('sound','Ativar som','sound')}${document.fullscreenEnabled?button('fullscreen','Tela cheia','screen','aria-label="Alternar tela cheia"'):''}</div>`;
      if(this.screen==='home')this.home();else if(this.screen==='options')this.options();else if(this.screen==='music')this.music();else if(this.screen==='credits')this.credits();else this.controls();
      this.main.scrollTop=0;this.updateSound();
    }
    home(){
      let advanced=false;try{const save=P.KelvorCampaignRC1.load();advanced=Object.values(save.worlds||{}).some(w=>Object.values(w.nodes||{}).some(v=>['COMPLETED','MASTERED','BOSS_DEFEATED'].includes(v)));}catch(_){}
      this.main.innerHTML=`<div class="km47-home"><div class="km47-home-copy"><p class="km47-overline">Cinco mundos. Uma grande aventura.</p><h1 class="km47-logo">KELVOR</h1><p class="km47-tagline">O extraordinário espera por você.</p><div class="km47-home-actions"><button class="km47-primary" data-action="play"><span class="km47-start-copy">${advanced?'Continuar aventura':'Começar aventura'}<small>Seu próximo caminho começa aqui</small></span>${icon('arrow')}</button><nav class="km47-home-nav" aria-label="Menu principal">${button('options','Opções','gear')}${button('music','Música','music')}${button('controls','Como jogar','book')}${button('credits','Créditos','heart')}</nav></div></div></div><div class="km47-world-caption"><small>O mundo de Kelvor</small>Além do primeiro horizonte.</div>`;
    }
    lead(title,sub){return `<div class="km47-lead"><div><p class="km47-overline">KELVOR</p><h1>${title}</h1><p>${sub}</p></div></div>`;}
    options(){
      const page=OPTIONS[this.tab];
      this.main.innerHTML=`<section class="km47-section">${this.lead('Do seu jeito.','Som, controles e conforto para a sua aventura.')}<nav class="km47-tabs" role="tablist" aria-label="Categorias de opções">${Object.entries(OPTIONS).map(([key,p])=>button('tab:'+key,p.name,p.icon,`role="tab" aria-selected="${key===this.tab}" aria-controls="km47-settings-panel"`)).join('')}</nav><p class="km47-note">${page.note}</p><div class="km47-card" id="km47-settings-panel" role="tabpanel" aria-label="${page.name}">${page.rows.map(r=>this.optionRow(r)).join('')}</div><div class="km47-option-foot"><span class="km47-saved" role="status">Ajustes aplicados ao jogo.</span>${button('reset','Restaurar ajustes')}</div></section>`;
    }
    optionRow(row){
      const [key,label,desc,min,max]=row,value=S.get(key);let control;
      if(Array.isArray(min))control=`<select id="km47-${key}" data-setting="${key}" aria-label="${label}">${min.map(v=>`<option value="${v}" ${v===value?'selected':''}>${{auto:'Automático',on:'Sempre visíveis',off:'Ocultos'}[v]}</option>`).join('')}</select>`;
      else if(typeof min==='number')control=`<div class="km47-range"><input id="km47-${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="1" value="${value}" aria-label="${label}" aria-valuetext="${value}%"><output for="km47-${key}">${value}%</output></div>`;
      else control=`<button id="km47-${key}" class="km47-toggle" data-setting-toggle="${key}" role="switch" aria-checked="${!!value}" aria-label="${label}"><i></i><span>${value?'Ligado':'Desligado'}</span></button>`;
      return `<div class="km47-row"><label for="km47-${key}"><span class="km47-row-title">${label}</span><small>${desc}</small></label>${control}</div>`;
    }
    saveSetting(key,value){
      S.set(key,value);this.applyAudio();this.root.dataset.motion=this.motion()?'on':'off';
      let persisted=false;try{persisted=JSON.stringify(JSON.parse(localStorage.getItem('kelvor_settings_v001'))?.[key])===JSON.stringify(S.get(key));}catch(_){}
      const saved=this.root.querySelector('.km47-saved');if(saved)saved.textContent=persisted?'Ajustes salvos automaticamente.':'Aplicado nesta sessão. O navegador não permitiu salvar.';
      return S.get(key);
    }
    music(){
      this.main.innerHTML=`<section class="km47-section">${this.lead('Escute a aventura.','Melodias, encontros e pequenas vitórias de Kelvor.')}<div class="km47-music-grid"><div class="km47-player"><div class="km47-orb">${icon('music')}</div><h2 data-music="title"></h2><p data-music="detail"></p><div class="km47-transport">${button('previous','Faixa anterior','previous','aria-label="Faixa anterior"')}${button('toggleTrack','Reproduzir','play','class="km47-play" aria-label="Reproduzir faixa"')}${button('next','Próxima faixa','next','aria-label="Próxima faixa"')}</div><p data-music="state" aria-live="polite"></p><div class="km47-range"><input type="range" data-setting="musicVolume" min="0" max="100" value="${S.get('musicVolume')}" aria-label="Volume da música"><output>${S.get('musicVolume')}%</output></div></div><div class="km47-track-list" role="group" aria-label="Faixas musicais">${TRACKS.map((t,i)=>`<button class="km47-track" data-action="track:${i}" aria-pressed="false"><span class="km47-track-number">${String(i+1).padStart(2,'0')}</span><span><strong>${escape(t.name)}</strong><small>${escape(t.detail)}</small></span>${icon('play')}</button>`).join('')}</div></div></section>`;
      this.main.querySelectorAll('.km47-transport button span').forEach(s=>s.hidden=true);this.refreshMusic();
    }
    refreshMusic(){
      if(this.screen!=='music')return;const t=TRACKS[this.track];this.root.dataset.playing=String(this.playing);this.root.dataset.track=String(this.track);
      this.root.querySelector('[data-music="title"]').textContent=t.name;this.root.querySelector('[data-music="detail"]').textContent=t.detail;
      this.root.querySelector('[data-music="state"]').textContent=this.playing?(t.loop?'Tocando · repete ao terminar':'Tocando'):'Toque para ouvir';
      const b=this.root.querySelector('[data-action="toggleTrack"]');b.innerHTML=icon(this.playing?'stop':'play');b.setAttribute('aria-label',this.playing?'Parar faixa':'Reproduzir faixa');
      this.root.querySelectorAll('[data-action^="track:"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.action.slice(6))===this.track)));
    }
    stopTrack(){this.audioSeq++;A?.stopMusic();this.soundRef=null;this.playing=false;this.refreshMusic();}
    playTrack(index=this.track){
      this.stopTrack();this.track=(index+TRACKS.length)%TRACKS.length;this.refreshMusic();const token=++this.audioSeq;
      return this.unlock().then(()=>{
        if(!this.alive||this.screen!=='music'||token!==this.audioSeq)return false;
        const t=TRACKS[this.track];const ok=A?.playMusic(this.scene,t.cue,t.loop,{gain:.72});this.soundRef=A?.currentMusic;this.playing=ok!==false&&!!this.soundRef;
        const sound=this.soundRef;if(sound)sound.once?.('complete',()=>{if(this.alive&&token===this.audioSeq&&this.soundRef===sound&&A?.currentMusic===sound){this.playing=false;this.refreshMusic();}});
        this.refreshMusic();this.updateSound();if(!this.playing)this.toast('Não foi possível tocar esta faixa. Tente novamente.');return this.playing;
      });
    }
    controls(){
      this.main.innerHTML=`<section class="km47-section">${this.lead('Sinta o caminho.','Tudo começa com uma escolha e um primeiro passo.')}<div class="km47-controls-grid"><article class="km47-instruction">${icon('hand')}<h2>No celular</h2><dl><dt>Explore o mapa</dt><dd>Toque em uma fase liberada ou nos botões de caminho. Kelvor caminha até ela.</dd><dt>Entre na aventura</dt><dd>Toque em Jogar. Nas fases, use o direcional e os botões de ação na tela.</dd><dt>Deixe confortável</dt><dd>Ajuste tamanho, visibilidade e posição em Opções → Toque.</dd></dl></article><article class="km47-instruction">${icon('compass')}<h2>No teclado</h2><dl><dt>Nos menus</dt><dd>Tab ou setas para escolher. Enter confirma; Escape volta.</dd><dt>No mapa</dt><dd>Setas ou WASD caminham. Enter entra na fase; M mostra o mundo inteiro.</dd><dt>Nas fases</dt><dd>Consulte as dicas de controle disponíveis ao jogar.</dd></dl></article><article class="km47-instruction">${icon('book')}<h2>Com gamepad</h2><dl><dt>Escolha e confirme</dt><dd>Direcional ou analógico para navegar. A confirma; B volta.</dd><dt>No mapa</dt><dd>X alterna a visão. LB e RB trocam entre os mundos liberados.</dd><dt>Na TV</dt><dd>Use um controle compatível. O suporte depende do aparelho e navegador.</dd></dl></article></div><p class="km47-controls-note">Seu caminho fica salvo ao chegar a uma fase. Você pode voltar e explorar novamente os caminhos já conquistados.</p></section>`;
    }
    credits(){
      this.main.innerHTML=`<section class="km47-section">${this.lead('Feito com carinho.','Cada detalhe faz parte desta jornada.')}<div class="km47-credits"><div class="km47-crest">${icon('compass')}</div><p class="km47-overline">Direção · Design · Criação</p><h2>Dennys Pavanelli</h2><p>Um mundo para descobrir.<br>Uma aventura para sentir.</p><div class="km47-credit-rule"></div><p class="km47-thanks">Obrigado por caminhar<br>com Kelvor.</p><p class="km47-credit-engine">Criado com Phaser 4.2.1</p></div></section>`;
    }
    navigate(screen){
      if(this.busy||!this.alive)return;
      if(screen==='controls'){this.screen='controls';this.render();this.root.querySelector('[data-action="back"]')?.focus();return;}
      if(screen==='home'&&this.screen==='controls'){this.screen='home';this.render();this.root.querySelector('[data-action="controls"]')?.focus();return;}
      this.busy=true;this.audioSeq++;if(this.screen==='music')A?.stopMusic();
      this.scene.scene.start(SCENES[screen]);
    }
    play(){
      if(this.busy||!this.alive)return;this.busy=true;this.audioSeq++;
      const go=()=>{if(!this.alive)return;P.DEBUG_BY_DEFAULT=!!S.get('debugOverlay');this.scene.scene.start('WorldMapSceneRC1');};
      if(S.get('fullscreenOnPlay')&&P.InputRouter?.hasTouch?.()&&document.fullscreenEnabled&&!this.scene.scale.isFullscreen){
        try{Promise.resolve(this.scene.scale.startFullscreen({navigationUI:'hide'})).catch(()=>{}).finally(go);}catch(_){go();}
      }else go();
    }
    resetDialog(){
      this.focusBeforeDialog=document.activeElement;const modal=this.root.querySelector('.km47-modal');modal.hidden=false;
      modal.innerHTML=`<div class="km47-dialog" role="dialog" aria-modal="true" aria-labelledby="km47-reset-title"><h2 id="km47-reset-title">Restaurar ajustes?</h2><p>Som, controles e conforto voltam aos valores iniciais. Sua aventura e as fases conquistadas continuam salvas.</p><div class="km47-dialog-actions">${button('cancelReset','Manter ajustes')}${button('confirmReset','Restaurar')}</div></div>`;
      modal.querySelector('button').focus();
    }
    closeDialog(){this.root.querySelector('.km47-modal').hidden=true;this.focusBeforeDialog?.focus?.();}
    action(action){
      if(this.busy)return;
      if(['options','music','credits','controls'].includes(action))return this.navigate(action);
      if(action==='play')return this.play();if(action==='back')return this.navigate('home');
      if(action.startsWith('tab:')){this.tab=action.slice(4);if(!OPTIONS[this.tab])this.tab='audio';this.options();this.root.querySelector(`[data-action="tab:${this.tab}"]`)?.focus();return;}
      if(action==='sound'){const ready=this.readyAudio();if(S.get('masterVolume')>0&&ready){this.lastMaster=S.get('masterVolume');this.saveSetting('masterVolume',0);}else{if(S.get('masterVolume')===0)this.saveSetting('masterVolume',this.lastMaster||100);this.unlock().then(()=>{if(this.alive){this.titleMusic();this.applyAudio();}});}return;}
      if(action==='fullscreen'){try{const result=document.fullscreenElement?document.exitFullscreen():document.getElementById('platformer-snes-v04-root')?.requestFullscreen?.();Promise.resolve(result).catch(()=>this.toast('Tela cheia não está disponível neste navegador.'));}catch(_){this.toast('Tela cheia não está disponível neste navegador.');}return;}
      if(action==='reset')return this.resetDialog();if(action==='cancelReset')return this.closeDialog();
      if(action==='confirmReset'){S.reset();this.applyAudio();this.root.dataset.motion=this.motion()?'on':'off';this.closeDialog();this.options();this.root.querySelector('[data-action=reset]')?.focus();this.toast('Ajustes restaurados. Sua aventura está preservada.');return;}
      if(action==='toggleTrack'){if(this.playing)this.stopTrack();else this.playTrack();return;}
      if(action==='previous'||action==='next'){const wasPlaying=this.playing;const index=(this.track+(action==='next'?1:-1)+TRACKS.length)%TRACKS.length;this.stopTrack();this.track=index;this.refreshMusic();if(wasPlaying)this.playTrack();return;}
      if(action.startsWith('track:'))this.playTrack(Number(action.slice(6)));
    }
    bind(){
      const signal=this.abort.signal;
      this.root.addEventListener('pointerdown',e=>{if(e.target.closest('[data-action="sound"]'))return;this.unlock().then(()=>{if(this.alive)this.titleMusic();});},{signal});
      this.root.addEventListener('click',e=>{
        const b=e.target.closest('button');if(!b||b.disabled||this.busy)return;
        this.ui();if(S.get('haptics'))try{navigator.vibrate?.(7);}catch(_){}
        if(b.dataset.settingToggle){const value=this.saveSetting(b.dataset.settingToggle,!S.get(b.dataset.settingToggle));b.setAttribute('aria-checked',String(value));b.querySelector('span').textContent=value?'Ligado':'Desligado';}
        else if(b.dataset.action)this.action(b.dataset.action);
      },{signal});
      const change=e=>{const el=e.target,key=el.dataset.setting;if(!key)return;const value=this.saveSetting(key,el.type==='range'?Number(el.value):el.value);if(el.type==='range'){el.setAttribute('aria-valuetext',value+'%');const output=el.parentElement.querySelector('output');if(output)output.textContent=value+'%';}};
      this.root.addEventListener('input',change,{signal});this.root.addEventListener('change',e=>{if(e.target.tagName==='SELECT')change(e);},{signal});
      window.addEventListener('keydown',e=>{
        if(!this.alive||this.busy||(e.repeat&&e.key!=='Tab'))return;
        if(['Escape','BrowserBack','GoBack'].includes(e.key)){e.preventDefault();if(!this.root.querySelector('.km47-modal').hidden)this.closeDialog();else if(this.screen!=='home')this.navigate('home');return;}
        const modal=!this.root.querySelector('.km47-modal').hidden;
        if(e.key==='Tab'&&modal){const all=this.focusables(),idx=all.indexOf(document.activeElement);if((e.shiftKey&&idx<=0)||(!e.shiftKey&&idx===all.length-1)){e.preventDefault();all[e.shiftKey?all.length-1:0]?.focus();}return;}
        if(e.repeat)return;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
          if(!modal&&['controls','credits'].includes(this.screen)&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();this.scrollText(e.key==='ArrowUp'?-1:1);return;}
          if(e.target?.tagName==='SELECT'||(e.target?.type==='range'&&['ArrowLeft','ArrowRight'].includes(e.key)))return;
          e.preventDefault();this.focusMove(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1);return;
        }
        if((e.key==='Enter'||e.key===' ')&&!this.root.contains(document.activeElement)){e.preventDefault();this.focusables()[0]?.focus();}
      },{signal});
      const neutral=()=>{this.padNeutral=false;this.padButtons=[];this.padNext=this.time+200;this.applyAudio();};
      window.addEventListener('blur',neutral,{signal});document.addEventListener('visibilitychange',neutral,{signal});
    }
    focusables(){const container=this.root.querySelector('.km47-modal').hidden?this.root:this.root.querySelector('.km47-modal');return [...container.querySelectorAll('button:not(:disabled),input,select')].filter(e=>e.getClientRects().length&&e.offsetWidth>0);}
    scrollText(direction){this.main.scrollBy?.({top:direction*Math.max(100,this.main.clientHeight*.55),behavior:this.motion()?'smooth':'auto'});}
    focusMove(direction){const all=this.focusables();if(!all.length)return;const at=all.indexOf(document.activeElement);const i=at<0?(direction>0?0:all.length-1):(at+direction+all.length)%all.length;all[i].focus();all[i].scrollIntoView?.({block:'nearest',inline:'nearest'});this.ui('UI_MOVE');}
    update(time){
      this.time=time;if(!this.alive||document.hidden)return;
      if(this.toastEnd&&time>this.toastEnd){this.root.querySelector('.km47-toast').hidden=true;this.toastEnd=0;}
      if(this.screen==='music'&&this.playing&&this.soundRef?.isPlaying===false&&!this.scene.sound?.locked){this.playing=false;this.refreshMusic();}
      let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected);}catch(_){}
      if(!pad){this.padNeutral=false;this.padButtons=[];return;}
      const down=i=>!!pad.buttons[i]?.pressed,pressed=i=>down(i)&&!this.padButtons[i];
      if(!this.padNeutral){this.padButtons=pad.buttons.map(b=>b.pressed);if(!pad.buttons.some(b=>b.pressed)&&!pad.axes.some(a=>Math.abs(a)>.35))this.padNeutral=true;return;}
      if(pressed(0)||pressed(9)){const e=document.activeElement;if(this.root.contains(e)){if(e.type==='range')this.focusMove(1);else e.click?.();}else this.focusables()[0]?.focus();}
      else if(pressed(1)){if(!this.root.querySelector('.km47-modal').hidden)this.closeDialog();else if(this.screen!=='home')this.navigate('home');}
      if(time>this.padNext){const dx=down(14)?-1:down(15)?1:Math.abs(pad.axes[0]||0)>.55?Math.sign(pad.axes[0]):0;const dy=down(12)?-1:down(13)?1:Math.abs(pad.axes[1]||0)>.55?Math.sign(pad.axes[1]):0;
        if(dx||dy){const e=document.activeElement;if(dy&&this.root.querySelector('.km47-modal').hidden&&['controls','credits'].includes(this.screen)){this.scrollText(dy);}else if(dx&&e?.type==='range'){e.value=String(Math.max(Number(e.min),Math.min(Number(e.max),Number(e.value)+dx*5)));e.dispatchEvent(new Event('input',{bubbles:true}));}else if(dx&&e?.tagName==='SELECT'){e.selectedIndex=(e.selectedIndex+dx+e.options.length)%e.options.length;e.dispatchEvent(new Event('change',{bubbles:true}));}else this.focusMove(dy||dx);this.padNext=time+190;}}
      this.padButtons=pad.buttons.map(b=>b.pressed);
    }
    toast(text){const el=this.root.querySelector('.km47-toast');el.textContent=text;el.hidden=false;this.toastEnd=this.time+3800;}
    destroy(){this.alive=false;this.audioSeq++;this.abort.abort();if(this.screen==='music')A?.stopMusic();this.root.remove();if(window.__KELVOR_MENU_V047__===this)delete window.__KELVOR_MENU_V047__;}
  }
  for(const [kind,name] of Object.entries(SCENES)){
    const prototype=P[name]?.prototype;if(!prototype)continue;
    prototype.create=function(){this.keys=null;this.ui=[];this.menuV047=new MenuController(this,kind);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.menuV047?.destroy();this.menuV047=null;});};
    prototype.update=function(time){this.menuV047?.update(time);};
  }
  P.MenuExperienceV047={MenuController,tracks:TRACKS,options:OPTIONS};
})(window.PlatformerSNESV04);
