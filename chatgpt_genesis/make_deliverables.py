#!/usr/bin/env python3
import base64, json, pathlib, shutil, subprocess, zipfile, textwrap
ROOT=pathlib.Path('chatgpt_genesis')
FINAL=ROOT/'final'
EXPORT=ROOT/'export'
SRC=ROOT/'src'
SRC.mkdir(exist_ok=True)
audio=EXPORT/'genesis_francisca_10min.mp3'
timeline=json.loads((EXPORT/'timeline.json').read_text(encoding='utf-8'))
cues=timeline['cues']

# Mux the already-rendered 10-minute visual track with the correct 10-minute Francisca audio.
visual=FINAL/'genesis_visual.mp4'
mp4=FINAL/'genesis_criacao_10min_francisca.mp4'
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(visual),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-t','600','-movflags','+faststart',str(mp4)],check=True)

# Encode exact voice and all 116 frame images directly into one standalone HTML.
audio64=base64.b64encode(audio.read_bytes()).decode('ascii')
frames=[]
for q in cues:
    p=FINAL/'frames'/f"cue_{q['i']:03d}.jpg"
    frames.append(base64.b64encode(p.read_bytes()).decode('ascii'))
frames_js=json.dumps(frames,separators=(',',':'))
tl_js=json.dumps(cues,ensure_ascii=False,separators=(',',':'))

html=f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>GÊNESIS — A Criação</title>
<style>
:root{{--red:#ff0033}}*{{box-sizing:border-box}}html,body{{margin:0;background:#050505;color:#fff;font-family:Arial,Helvetica,sans-serif}}body{{min-height:100vh;display:grid;place-items:center}}
.wrap{{width:min(1500px,100vw)}}.player{{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;user-select:none}}canvas{{width:100%;height:100%;display:block}}
.top{{position:absolute;left:0;right:0;top:0;padding:17px 20px 46px;background:linear-gradient(#000b,transparent);font-weight:800;font-size:clamp(14px,1.4vw,20px);transition:.2s}}
.sub{{position:absolute;left:7%;right:7%;bottom:57px;text-align:center;font-size:clamp(14px,1.55vw,22px);font-weight:800;line-height:1.25;text-shadow:0 2px 2px #000,0 0 8px #000,0 0 15px #000;pointer-events:none;min-height:1.4em}}
.shell{{position:absolute;left:0;right:0;bottom:0;padding:0 11px 8px;background:linear-gradient(transparent,#000e);transition:.2s}}.hide .shell,.hide .top{{opacity:0}}
.seek{{width:100%;height:4px;appearance:none;-webkit-appearance:none;background:linear-gradient(to right,var(--red) 0,var(--red) var(--p,0%),#ffffff55 var(--p,0%),#ffffff55 100%);border-radius:9px;accent-color:var(--red)}}
.row{{height:43px;display:flex;align-items:center;gap:2px}}button{{border:0;background:transparent;color:#fff;width:42px;height:39px;border-radius:50%;cursor:pointer;font-size:19px}}button:hover{{background:#ffffff18}}.sm{{width:auto;min-width:42px;padding:0 8px;border-radius:6px;font-size:13px;font-weight:800}}
.time{{font-size:12px;white-space:nowrap;margin-left:4px}}.right{{margin-left:auto;display:flex;align-items:center}}.menu{{display:none;position:absolute;right:12px;bottom:60px;background:#181818f7;border:1px solid #ffffff22;border-radius:10px;padding:8px;max-height:65%;overflow:auto;width:min(330px,82vw);z-index:6}}.menu.show{{display:block}}.menu button{{display:block;width:100%;text-align:left;border-radius:6px;font-size:13px}}
.start{{position:absolute;inset:0;z-index:9;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#36415a55,#000e)}}.card{{width:min(720px,91%);padding:28px;text-align:center;background:#070709bb;border:1px solid #ffffff23;border-radius:18px;backdrop-filter:blur(9px)}}.card h1{{font:600 clamp(42px,7vw,80px)/.9 Georgia,serif;margin:0;color:#fff0c7}}.card p{{color:#ddd;line-height:1.5}}.go{{width:auto;height:auto;padding:13px 20px;border-radius:8px;background:#fff;color:#111;font-size:15px;font-weight:900}}
.info{{background:#111;padding:15px 19px;color:#ccc;font-size:13px;line-height:1.45}}@media(max-width:700px){{.top{{padding:10px 12px 35px}}.shell{{padding:0 5px 5px}}.row{{height:36px}}button{{width:35px;height:34px;font-size:16px}}.sm{{min-width:35px;padding:0 4px}}.time{{font-size:10px}}.sub{{bottom:47px;left:3%;right:3%;font-size:13px}}}}
</style></head><body><div class="wrap"><div class="player" id="player"><canvas id="c" width="1280" height="720"></canvas><div class="top" id="cap">GÊNESIS — A Criação</div><div class="sub" id="sub"></div><div class="shell"><input class="seek" id="seek" type="range" min="0" max="600" step=".05" value="0"><div class="row"><button id="play">▶</button><button id="back">↶</button><button id="next">↷</button><button id="mute">🔊</button><span class="time" id="tm">0:00 / 10:00</span><div class="right"><button class="sm" id="cc">CC</button><button class="sm" id="chap">☷</button><button class="sm" id="speed">1×</button><button id="fs">⛶</button></div></div></div><div class="menu" id="menu"></div><div class="start" id="start"><div class="card"><h1>GÊNESIS</h1><p>A Criação · 10 minutos · narração neural Francisca incorporada ao arquivo</p><button class="go" id="go">▶ Assistir agora</button></div></div></div><div class="info"><b>Arquivo autônomo:</b> voz <b>pt-BR-FranciscaNeural</b>, 116 planos, capítulos, legendas, busca, velocidade, atalhos e tela cheia. Não usa a voz instalada no navegador.</div></div>
<audio id="audio" preload="auto" src="data:audio/mpeg;base64,{audio64}"></audio>
<script>
const CUES={tl_js};const B64={frames_js};const imgs=[];B64.forEach((b,i)=>{{let m=new Image();m.src='data:image/jpeg;base64,'+b;imgs[i]=m}});
const a=document.getElementById('audio'),c=document.getElementById('c'),x=c.getContext('2d'),seek=document.getElementById('seek'),sub=document.getElementById('sub'),cap=document.getElementById('cap'),tm=document.getElementById('tm'),player=document.getElementById('player'),menu=document.getElementById('menu');let captions=true,rate=1,uiTimer;
function fmt(s){{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}}function cueAt(t){{let lo=0,hi=CUES.length-1;while(lo<=hi){{let m=(lo+hi)>>1,q=CUES[m];if(t<q.start)hi=m-1;else if(t>=q.pause_end)lo=m+1;else return q}}return CUES[Math.max(0,Math.min(CUES.length-1,lo))]}}
function render(){{let t=a.currentTime||0,q=cueAt(t),im=imgs[q.i-1];if(im&&im.complete)x.drawImage(im,0,0,1280,720);else{{x.fillStyle='#050505';x.fillRect(0,0,1280,720)}}sub.textContent=captions&&t>=q.start&&t<=q.end?q.text:'';cap.textContent=q.cap;seek.value=t;seek.style.setProperty('--p',(t/600*100)+'%');tm.textContent=fmt(t)+' / 10:00';document.getElementById('play').textContent=a.paused?'▶':'❚❚';requestAnimationFrame(render)}}render();
function toggle(){{a.paused?a.play():a.pause()}}document.getElementById('go').onclick=()=>{{document.getElementById('start').style.display='none';a.play()}};document.getElementById('play').onclick=toggle;document.getElementById('mute').onclick=()=>{{a.muted=!a.muted;document.getElementById('mute').textContent=a.muted?'🔇':'🔊'}};document.getElementById('back').onclick=()=>a.currentTime=Math.max(0,a.currentTime-10);document.getElementById('next').onclick=()=>a.currentTime=Math.min(600,a.currentTime+10);seek.oninput=()=>a.currentTime=parseFloat(seek.value);document.getElementById('cc').onclick=()=>{{captions=!captions}};
document.getElementById('speed').onclick=()=>{{menu.innerHTML='';[.5,.75,1,1.25,1.5,2].forEach(v=>{{let b=document.createElement('button');b.textContent=v+'×';b.onclick=()=>{{rate=v;a.playbackRate=v;document.getElementById('speed').textContent=v+'×';menu.classList.remove('show')}};menu.appendChild(b)}});menu.classList.add('show')}};
document.getElementById('chap').onclick=()=>{{menu.innerHTML='';let seen=new Set;CUES.forEach(q=>{{if(seen.has(q.cap))return;seen.add(q.cap);let b=document.createElement('button');b.textContent=fmt(q.start)+'  '+q.cap;b.onclick=()=>{{a.currentTime=q.start;menu.classList.remove('show')}};menu.appendChild(b)}});menu.classList.add('show')}};
document.getElementById('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():player.requestFullscreen();document.addEventListener('keydown',e=>{{let k=e.key.toLowerCase();if(k===' '||k==='k'){{e.preventDefault();toggle()}}else if(k==='j')a.currentTime=Math.max(0,a.currentTime-10);else if(k==='l')a.currentTime=Math.min(600,a.currentTime+10);else if(k==='m')document.getElementById('mute').click();else if(k==='c')captions=!captions;else if(k==='f')document.getElementById('fs').click();else if(e.key==='ArrowRight')a.currentTime=Math.min(600,a.currentTime+5);else if(e.key==='ArrowLeft')a.currentTime=Math.max(0,a.currentTime-5)}});player.addEventListener('mousemove',()=>{{player.classList.remove('hide');clearTimeout(uiTimer);if(!a.paused)uiTimer=setTimeout(()=>player.classList.add('hide'),2200)}})
</script></body></html>'''
(FINAL/'genesis_criacao_10min_francisca.html').write_text(html,encoding='utf-8')

# Editable source files for project ZIP.
player_js='''// Player source: standalone HTML build contains this logic inline.\n// Voice is pre-rendered pt-BR-FranciscaNeural, not speechSynthesis.\n'''
scenes_js='''// Scene map\nexport const SCENES=['trevas','luz','firmamento','terra','plantas','luminares','mar','aves','animais','homem','eden','nomes','mulher','bencao','descanso','epilogo'];\n'''
timeline_js='export const DURATION=600;\nexport const VOICE="pt-BR-FranciscaNeural";\n'
(SRC/'player.js').write_text(player_js,encoding='utf-8');(SRC/'scenes.js').write_text(scenes_js,encoding='utf-8');(SRC/'timeline.js').write_text(timeline_js,encoding='utf-8')
readme='''GÊNESIS — A CRIAÇÃO\n\nSaídas:\n- genesis_criacao_10min_francisca.html: arquivo autônomo com Francisca Neural incorporada.\n- genesis_criacao_10min_francisca.mp4: vídeo de 10 minutos para YouTube.\n\nVoz: pt-BR-FranciscaNeural, gerada via edge-tts no GitHub Actions.\nA representação visual não mostra a Terra como globo; usa horizonte, águas, firmamento, terra seca e paisagens.\n'''
(ROOT/'LEIA-ME-GENESIS.txt').write_text(readme,encoding='utf-8')

zip_path=FINAL/'genesis_criacao_projeto_completo.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in [ROOT/'roteiro.json',ROOT/'generate_tts.py',ROOT/'build_final_audio.py',ROOT/'finalize.py',EXPORT/'timeline.json',ROOT/'LEIA-ME-GENESIS.txt',SRC/'player.js',SRC/'scenes.js',SRC/'timeline.js',FINAL/'genesis_criacao_10min_francisca.html',FINAL/'genesis_criacao_10min_francisca.mp4']:
        z.write(p,p.relative_to(ROOT))
print('HTML', (FINAL/'genesis_criacao_10min_francisca.html').stat().st_size)
print('MP4',mp4.stat().st_size)
print('ZIP',zip_path.stat().st_size)
