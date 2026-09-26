#!/usr/bin/env python3
import base64, json, math, os, pathlib, subprocess, textwrap, random
from PIL import Image, ImageDraw, ImageFont
from mutagen.mp3 import MP3

ROOT=pathlib.Path('chatgpt_genesis')
OUT=ROOT/'out'
FINAL=ROOT/'final'
FINAL.mkdir(parents=True,exist_ok=True)
roteiro=json.loads((ROOT/'roteiro.json').read_text(encoding='utf-8'))
clips=json.loads((OUT/'clips.json').read_text(encoding='utf-8'))['clips']

# Flatten dialogue metadata and build exact 600s timeline using per-line lead/pause.
falas=[]
for cena in roteiro:
    for f in cena['falas']:
        falas.append((cena,f))
assert len(falas)==len(clips)
raw=sum(float(c['dur'])+float(f.get('p',.6))+float(f.get('l',0)) for (_,f),c in zip(falas,clips))
scale=(600.0-sum(float(c['dur']) for c in clips))/max(.001,sum(float(f.get('p',.6))+float(f.get('l',0)) for _,f in falas))
timeline=[]
cursor=0.0
for i,((cena,f),c) in enumerate(zip(falas,clips),1):
    lead=float(f.get('l',0))*scale
    pause=float(f.get('p',.6))*scale
    start=cursor+lead
    dur=float(c['dur'])
    end=start+dur
    timeline.append(dict(i=i,scene=cena['id'],cap=cena['cap'],dia=cena.get('dia'),text=f['t'],start=start,end=end,dur=dur,pause=pause,lead=lead,file=c['file']))
    cursor=end+pause
# normalize tiny rounding to exactly 600
if timeline:
    timeline[-1]['pause']+=600.0-cursor

# Make concat narration with silence according to timeline.
parts=[]
for q in timeline:
    if q['lead']>0.01:
        parts.append(('silence',q['lead'],None))
    parts.append(('audio',q['dur'],OUT/q['file']))
    if q['pause']>0.01:
        parts.append(('silence',q['pause'],None))

concat=FINAL/'audio_concat.txt'
with concat.open('w',encoding='utf-8') as fh:
    for typ,d,p in parts:
        if typ=='audio':
            fh.write(f"file '{p.resolve()}'\n")
        else:
            # generate silence wav snippets on demand
            sp=FINAL/f"sil_{len(list(FINAL.glob('sil_*.wav'))):04d}.wav"
            subprocess.run(['ffmpeg','-loglevel','error','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t',f'{d:.4f}','-c:a','pcm_s16le',str(sp)],check=True)
            fh.write(f"file '{sp.resolve()}'\n")
narr=FINAL/'narracao_francisca_600s.mp3'
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-t','600','-c:a','libmp3lame','-b:a','64k',str(narr)],check=True)

# Prepare fonts.
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
SERIF='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
def fnt(n,b=False,ser=False):
    return ImageFont.truetype(SERIF if ser else (BOLD if b else FONT),n)

W,H=1280,720
random.seed(7)

def grad(im, top, bottom):
    d=ImageDraw.Draw(im)
    for y in range(H):
        t=y/(H-1); c=tuple(int(top[i]*(1-t)+bottom[i]*t) for i in range(3))
        d.line((0,y,W,y),fill=c)

def stars(d,n=120,alpha=255):
    for i in range(n):
        x=random.randrange(W); y=random.randrange(0,430); r=random.choice([1,1,1,2])
        d.ellipse((x-r,y-r,x+r,y+r),fill=(245,248,255,alpha))

def mountain(d,base=470,seed=0,col=(65,72,74),col2=(39,45,46)):
    rr=random.Random(seed); pts=[(0,H)]
    x=0
    while x<=W:
        peak=base-rr.randint(35,150)
        pts.append((x,peak)); x+=rr.randint(90,150)
    pts += [(W,H)]
    d.polygon(pts,fill=col)
    # diagonal shaded facets
    for j in range(1,len(pts)-2):
        px,py=pts[j]; nx,ny=pts[j+1]
        d.polygon([(px,py),(nx,ny),((px+nx)//2,base+80)],fill=col2 if j%2 else tuple(min(255,v+18) for v in col))

def tree(d,x,y,s=1.0,acacia=False):
    trunk=(x-8*s,y-110*s,x+8*s,y+15*s); d.rounded_rectangle(trunk,radius=int(7*s),fill=(76,49,28))
    if acacia:
        d.ellipse((x-95*s,y-145*s,x+95*s,y-80*s),fill=(48,88,46))
        d.ellipse((x-55*s,y-170*s,x+70*s,y-100*s),fill=(55,99,48))
    else:
        for dx,dy,rx,ry in [(-55,-135,70,50),(20,-150,78,55),(50,-115,65,44)]:
            d.ellipse((x+(dx-rx)*s,y+(dy-ry)*s,x+(dx+rx)*s,y+(dy+ry)*s),fill=(45,95,49))

def human(d,x,y,s=1.0,female=False):
    skin=(177,126,91) if female else (160,111,80)
    hair=(70,43,30)
    d.ellipse((x-20*s,y-165*s,x+20*s,y-125*s),fill=skin)
    d.rounded_rectangle((x-24*s,y-126*s,x+24*s,y-35*s),radius=int(14*s),fill=skin)
    d.line((x-16*s,y-40*s,x-20*s,y+35*s),fill=skin,width=max(1,int(12*s)))
    d.line((x+16*s,y-40*s,x+20*s,y+35*s),fill=skin,width=max(1,int(12*s)))
    d.line((x-22*s,y-105*s,x-60*s,y-45*s),fill=skin,width=max(1,int(10*s)))
    d.line((x+22*s,y-105*s,x+60*s,y-45*s),fill=skin,width=max(1,int(10*s)))
    if female:
        d.arc((x-32*s,y-178*s,x+32*s,y-105*s),180,355,fill=hair,width=max(2,int(11*s)))
        d.line((x-25*s,y-155*s,x-30*s,y-70*s),fill=hair,width=max(2,int(10*s)))
        d.line((x+25*s,y-155*s,x+30*s,y-70*s),fill=hair,width=max(2,int(10*s)))
    else:
        d.arc((x-28*s,y-177*s,x+28*s,y-130*s),180,355,fill=hair,width=max(2,int(8*s)))

def animal(d,kind,x,y,s=1.0):
    if kind=='lion':
        d.ellipse((x-70*s,y-35*s,x+55*s,y+25*s),fill=(169,105,57)); d.ellipse((x-95*s,y-55*s,x-45*s,y-5*s),fill=(188,122,67)); d.ellipse((x-108*s,y-66*s,x-33*s,y+9*s),outline=(105,63,34),width=max(2,int(10*s)))
    elif kind=='elephant':
        d.ellipse((x-85*s,y-50*s,x+70*s,y+30*s),fill=(108,112,110)); d.ellipse((x-105*s,y-55*s,x-50*s,y),fill=(115,118,116)); d.line((x-98*s,y-20*s,x-115*s,y+45*s),fill=(100,105,103),width=max(2,int(13*s)))
    elif kind=='deer':
        d.ellipse((x-55*s,y-26*s,x+45*s,y+18*s),fill=(132,95,65)); d.ellipse((x-76*s,y-55*s,x-48*s,y-18*s),fill=(142,103,72))
    elif kind=='giraffe':
        d.ellipse((x-50*s,y-28*s,x+40*s,y+18*s),fill=(206,162,85)); d.rectangle((x-40*s,y-105*s,x-22*s,y-15*s),fill=(206,162,85)); d.ellipse((x-50*s,y-125*s,x-15*s,y-95*s),fill=(206,162,85))
    for dx in (-35,25):
        d.line((x+dx*s,y+10*s,x+dx*s,y+55*s),fill=(90,70,55),width=max(2,int(8*s)))

def ocean_scene(img, idx):
    grad(img,(31,130,177),(4,39,62)); d=ImageDraw.Draw(img,'RGBA')
    for k in range(12):
        d.polygon([(k*115,0),(k*115+65,0),(k*115+280,H),(k*115+210,H)],fill=(255,255,220,12))
    for i in range(35):
        x=(i*97+idx*31)%W; y=120+(i*47)%470
        d.ellipse((x-16,y-6,x+16,y+6),fill=(206,145,70,230)); d.polygon([(x+15,y),(x+28,y-8),(x+28,y+8)],fill=(206,145,70,230))

def scene_frame(q, idx):
    img=Image.new('RGB',(W,H)); d=ImageDraw.Draw(img,'RGBA'); sc=q['scene']
    if sc in ('trevas','luz'):
        grad(img,(2,4,10),(8,10,17)); stars(d,100)
        if sc=='trevas':
            d.ellipse((80,410,1200,680),fill=(8,21,35,210))
            d.ellipse((420,320,860,560),fill=(72,88,130,35))
        else:
            cx=int(120+min(1,(idx%8)/7)*760); d.ellipse((cx-220,120,cx+420,680),fill=(255,213,120,40)); d.ellipse((cx-65,270,cx+65,400),fill=(255,243,205,230))
    elif sc=='firmamento':
        grad(img,(80,152,207),(218,190,145)); d.rectangle((0,425,W,H),fill=(61,106,128,255)); d.arc((70,-60,1210,720),185,355,fill=(230,245,255,150),width=6)
        for i in range(9): d.ellipse((80+i*145,110+(i%3)*45,260+i*145,220+(i%3)*45),fill=(255,255,255,55))
    elif sc in ('terra','plantas'):
        grad(img,(113,180,216),(224,196,139)); mountain(d,455,idx,(79,83,77),(51,57,54)); d.rectangle((0,470,W,H),fill=(92,91,54))
        if sc=='plantas':
            d.rectangle((0,470,W,H),fill=(68,105,48))
            for i in range(8): tree(d,80+i*170,520-(i%2)*25,.55+(i%3)*.15)
            for i in range(45): x=(i*79)%W; y=535+(i*37)%150; d.ellipse((x-3,y-3,x+3,y+3),fill=(245,210,140,230))
        else:
            # waterfalls
            for x0 in (350,780): d.line((x0,310,x0,520),fill=(180,220,235,180),width=8)
    elif sc=='luminares':
        grad(img,(18,36,68),(123,93,90)); stars(d,170); mountain(d,510,idx,(40,49,50),(25,30,32)); d.rectangle((0,515,W,H),fill=(28,43,29))
        d.ellipse((960,105,1045,190),fill=(245,240,216,245))
    elif sc in ('mar','aves'):
        if sc=='mar': ocean_scene(img,idx)
        else:
            grad(img,(92,174,217),(219,200,153)); mountain(d,505,idx,(68,79,73),(45,54,50)); d.rectangle((0,515,W,H),fill=(80,112,56))
            for i in range(9):
                x0=100+i*140; y0=120+(i%3)*40; d.arc((x0-22,y0-10,x0,y0+10),190,350,fill=(35,35,35),width=3); d.arc((x0,y0-10,x0+22,y0+10),190,350,fill=(35,35,35),width=3)
    elif sc=='animais':
        grad(img,(105,178,211),(226,195,137)); mountain(d,470,idx,(75,82,72),(49,56,49)); d.rectangle((0,470,W,H),fill=(132,125,65)); tree(d,1050,475,.9,True)
        kinds=['lion','elephant','giraffe','deer']; animal(d,kinds[idx%4],530,560,1.15); animal(d,kinds[(idx+1)%4],850,585,.7)
    elif sc=='homem':
        grad(img,(113,181,213),(222,195,139)); mountain(d,470,idx,(77,83,74),(48,55,49)); d.rectangle((0,470,W,H),fill=(77,108,53))
        human(d,640,575,1.5,False); d.ellipse((470,300,810,640),fill=(255,226,150,28))
    elif sc in ('eden','nomes','mulher','bencao'):
        grad(img,(91,177,211),(205,219,171)); mountain(d,440,idx,(66,96,72),(43,68,51)); d.rectangle((0,445,W,H),fill=(65,101,56))
        for i in range(8): tree(d,50+i*170,500-(i%3)*25,.62+(i%2)*.13)
        d.polygon([(520,445),(700,445),(850,H),(520,H)],fill=(73,165,188,220))
        if sc=='eden': human(d,470,590,1.05,False)
        elif sc=='nomes':
            human(d,380,595,.95,False); animal(d,'lion',720,580,.65); animal(d,'deer',930,590,.55)
        elif sc=='mulher':
            human(d,460,595,.95,False); human(d,720,595,.95,True); d.ellipse((590,245,850,600),fill=(255,230,170,25))
        else:
            human(d,520,595,.9,False); human(d,690,595,.9,True); animal(d,'deer',930,600,.5)
    elif sc=='descanso':
        grad(img,(43,77,120),(214,145,99)); stars(d,70,160); mountain(d,500,idx,(55,66,57),(36,46,39)); d.rectangle((0,505,W,H),fill=(49,68,42)); tree(d,1040,500,.8,True)
        human(d,565,600,.78,False); human(d,675,600,.78,True)
    else:
        grad(img,(25,41,78),(194,125,88)); stars(d,120,190); mountain(d,485,idx,(49,65,55),(32,44,37)); d.rectangle((0,495,W,H),fill=(40,61,40)); tree(d,1030,495,.75,True); human(d,590,610,.65,False); human(d,670,610,.65,True)

    # cinematic vignette
    for k in range(16):
        a=int(5+k*2); d.rectangle((k,k,W-k-1,H-k-1),outline=(0,0,0,a),width=1)
    # chapter
    d.rectangle((0,0,W,80),fill=(0,0,0,65))
    d.text((30,22),q['cap'],font=fnt(23,True),fill=(255,247,225,240))
    # subtitle lower
    txt=q['text']; lines=textwrap.wrap(txt,width=58)
    boxh=42*len(lines)+24; y=H-boxh-28
    d.rounded_rectangle((110,y-10,W-110,H-18),radius=16,fill=(0,0,0,110))
    yy=y
    for line in lines:
        bb=d.textbbox((0,0),line,font=fnt(27,True)); tw=bb[2]-bb[0]
        d.text(((W-tw)//2,yy),line,font=fnt(27,True),fill=(255,255,255,255),stroke_width=2,stroke_fill=(0,0,0,210)); yy+=38
    return img

# Create one image per narration cue
FR=FINAL/'frames'
FR.mkdir(exist_ok=True)
for idx,q in enumerate(timeline,1):
    scene_frame(q,idx).save(FR/f'cue_{idx:03d}.jpg',quality=88,subsampling=1)

# Create ffconcat with stills duration matching exact cue span (audio + lead + pause)
ff=FINAL/'video.ffconcat'
with ff.open('w',encoding='utf-8') as h:
    h.write('ffconcat version 1.0\n')
    for q in timeline:
        span=q['lead']+q['dur']+q['pause']
        p=(FR/f"cue_{q['i']:03d}.jpg").resolve()
        h.write(f"file '{p}'\n")
        h.write(f"duration {span:.6f}\n")
    h.write(f"file '{(FR/f'cue_{len(timeline):03d}.jpg').resolve()}'\n")

# MP4: crossfade-ish via fps + subtle zoompan; kept efficient.
silent=FINAL/'genesis_visual.mp4'
subprocess.run([
 'ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',str(ff),
 '-vf',"scale=1280:720,zoompan=z='min(zoom+0.00012,1.035)':d=1:s=1280x720:fps=12,format=yuv420p",
 '-t','600','-r','12','-c:v','libx264','-preset','veryfast','-crf','27','-pix_fmt','yuv420p',str(silent)
],check=True)
mp4=FINAL/'genesis_criacao_10min_francisca.mp4'
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(silent),'-i',str(narr),'-c:v','copy','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart',str(mp4)],check=True)

# Self-contained HTML with embedded narration MP3 and the same timeline.
audio_b64=base64.b64encode(narr.read_bytes()).decode('ascii')
timeline_json=json.dumps(timeline,ensure_ascii=False,separators=(',',':'))
html=f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GÊNESIS — A Criação</title><style>
*{{box-sizing:border-box}}html,body{{margin:0;background:#050505;color:#fff;font-family:Arial,sans-serif}}body{{display:grid;place-items:center;min-height:100vh}}
.wrap{{width:min(1500px,100vw)}}.p{{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden}}canvas{{width:100%;height:100%;display:block}}
.sub{{position:absolute;left:8%;right:8%;bottom:58px;text-align:center;font-size:clamp(15px,1.7vw,25px);font-weight:700;text-shadow:0 2px 3px #000,0 0 10px #000}}
.top{{position:absolute;left:0;right:0;top:0;padding:18px;background:linear-gradient(#000b,transparent);font-weight:700}}.ctrl{{position:absolute;left:0;right:0;bottom:0;padding:8px 12px;background:linear-gradient(transparent,#000e)}}
.row{{display:flex;align-items:center;gap:7px}}button{{border:0;background:transparent;color:#fff;font-size:20px;padding:8px;cursor:pointer}}input[type=range]{{width:100%;accent-color:#f03}}.time{{font-size:12px;white-space:nowrap}}
.info{{background:#111;padding:14px 18px;color:#ccc;font-size:13px}}.cc{{font-size:13px;font-weight:bold}}
</style></head><body><div class="wrap"><div class="p" id="p"><canvas id="c" width="1280" height="720"></canvas><div class="top" id="cap">GÊNESIS — A Criação</div><div class="sub" id="sub"></div><div class="ctrl"><input id="seek" type="range" min="0" max="600" step=".05" value="0"><div class="row"><button id="play">▶</button><button id="mute">🔊</button><span class="time" id="time">0:00 / 10:00</span><span style="flex:1"></span><button class="cc" id="cc">CC</button><button id="fs">⛶</button></div></div></div><div class="info">Narração incorporada: <b>pt-BR-FranciscaNeural</b>. Arquivo único, sem depender da voz instalada no navegador.</div></div>
<audio id="a" preload="auto" src="data:audio/mpeg;base64,{audio_b64}"></audio>
<script>
const TL={timeline_json}; const a=document.getElementById('a'),c=document.getElementById('c'),x=c.getContext('2d'),sub=document.getElementById('sub'),cap=document.getElementById('cap'),seek=document.getElementById('seek'),time=document.getElementById('time'); let cc=true;
const imgs={{}}; function img(i){{if(!imgs[i]){{let m=new Image();m.src='https://raw.githubusercontent.com/dennyscel/KELVOR/chatgpt-genesis-francisca-public/chatgpt_genesis/final/frames/cue_'+String(i).padStart(3,'0')+'.jpg';imgs[i]=m}}return imgs[i]}}
function fmt(s){{s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}}
function qAt(t){{return TL.find(q=>t>=q.start-q.lead&&t<q.end+q.pause)||TL[TL.length-1]}}
function draw(){{let t=a.currentTime||0,q=qAt(t),m=img(q.i);if(m.complete)x.drawImage(m,0,0,1280,720);else{{x.fillStyle='#111';x.fillRect(0,0,1280,720)}}sub.textContent=cc&&t>=q.start&&t<=q.end?q.text:'';cap.textContent=q.cap;seek.value=t;time.textContent=fmt(t)+' / 10:00';requestAnimationFrame(draw)}}draw();
document.getElementById('play').onclick=()=>{{a.paused?a.play():a.pause();document.getElementById('play').textContent=a.paused?'▶':'❚❚'}};
document.getElementById('mute').onclick=()=>{{a.muted=!a.muted;document.getElementById('mute').textContent=a.muted?'🔇':'🔊'}};
document.getElementById('cc').onclick=()=>{{cc=!cc}}; document.getElementById('fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.getElementById('p').requestFullscreen();
seek.oninput=()=>a.currentTime=parseFloat(seek.value); c.onclick=()=>document.getElementById('play').click(); document.addEventListener('keydown',e=>{{if(e.key===' '||e.key.toLowerCase()==='k'){{e.preventDefault();document.getElementById('play').click()}}if(e.key.toLowerCase()==='m')document.getElementById('mute').click();if(e.key.toLowerCase()==='f')document.getElementById('fs').click();if(e.key==='ArrowRight')a.currentTime=Math.min(600,a.currentTime+5);if(e.key==='ArrowLeft')a.currentTime=Math.max(0,a.currentTime-5)}})
</script></body></html>'''
(FINAL/'genesis_criacao_10min_francisca.html').write_text(html,encoding='utf-8')

# Base64-split MP4 for reliable later retrieval through text-only APIs.
b64=base64.b64encode(mp4.read_bytes()).decode('ascii')
CH=700000
chunks=[b64[i:i+CH] for i in range(0,len(b64),CH)]
B=FINAL/'mp4_b64'
B.mkdir(exist_ok=True)
for i,ch in enumerate(chunks):
    (B/f'chunk_{i:03d}.txt').write_text(ch,encoding='ascii')
(FINAL/'mp4_manifest.json').write_text(json.dumps({'chunks':len(chunks),'size':mp4.stat().st_size,'filename':mp4.name},indent=2),encoding='utf-8')
(FINAL/'timeline.json').write_text(json.dumps(timeline,ensure_ascii=False,indent=2),encoding='utf-8')
print('DONE',narr.stat().st_size,mp4.stat().st_size,len(chunks))
