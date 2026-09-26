#!/usr/bin/env python3
import base64, json, math, pathlib, random
from pydub import AudioSegment
from pydub.generators import Sine, WhiteNoise

ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT/'out'
EXP=ROOT/'export'
EXP.mkdir(exist_ok=True)

roteiro=json.loads((ROOT/'roteiro.json').read_text(encoding='utf-8'))
manifest=json.loads((OUT/'clips.json').read_text(encoding='utf-8'))
clips=manifest['clips']
falas=[]
scene_ranges=[]
idx=0
for si,c in enumerate(roteiro):
    start=idx
    for f in c['falas']:
        falas.append((si,c,f))
        idx+=1
    scene_ranges.append([start,idx])

assert len(falas)==len(clips)
speech_ms=sum(round(c['dur']*1000) for c in clips)
lead_ms=sum(round(float(f.get('l',0))*1000) for _,_,f in falas)
pause_pref=[round(float(f.get('p',.65))*1000) for _,_,f in falas]
base=speech_ms+lead_ms+sum(pause_pref)
TARGET=600000

# Rebalance only silence. Preserve all requested dramatic leads.
if base <= TARGET:
    extra=TARGET-base
    weights=[1.0 + (0.8 if i in [5,13,20,27,34,43,56,64,75,82,89,98,104,110,115] else 0) for i in range(len(falas))]
    ws=sum(weights)
    pauses=[p + int(extra*w/ws) for p,w in zip(pause_pref,weights)]
else:
    available=TARGET-speech_ms-lead_ms
    if available < 0:
        raise RuntimeError(f'Speech alone exceeds 10 minutes: {speech_ms/1000:.1f}s')
    total_pref=sum(pause_pref)
    pauses=[max(120,int(p*available/total_pref)) for p in pause_pref]

# Fix rounding exactly.
used=speech_ms+lead_ms+sum(pauses)
pauses[-1]+=TARGET-used

timeline=[]
master=AudioSegment.silent(duration=0,frame_rate=24000)
cursor=0
for i,((si,c,f),clip,pm) in enumerate(zip(falas,clips,pauses),1):
    lead=round(float(f.get('l',0))*1000)
    if lead:
        master += AudioSegment.silent(duration=lead,frame_rate=24000)
        cursor += lead
    audio=AudioSegment.from_mp3(OUT/clip['file']).set_channels(1).set_frame_rate(24000)
    start=cursor
    master += audio
    cursor += len(audio)
    end=cursor
    timeline.append({
        'i':i,'scene':si,'scene_id':c['id'],'cap':c['cap'],'day':c.get('dia'),
        'start':round(start/1000,3),'end':round(end/1000,3),
        'pause_end':round((end+pm)/1000,3),'text':f['t']
    })
    master += AudioSegment.silent(duration=pm,frame_rate=24000)
    cursor += pm

# Final hard trim/pad to exactly 10 minutes.
if len(master)<TARGET:
    master += AudioSegment.silent(duration=TARGET-len(master),frame_rate=24000)
else:
    master=master[:TARGET]

# Soft procedural score/ambience, kept well below narration.
bed=AudioSegment.silent(duration=TARGET,frame_rate=24000)
tones=[55,65.4,73.4,82.4,98,110]
chapter_starts=[]
for si,(a,b) in enumerate(scene_ranges):
    if a<len(timeline):
        chapter_starts.append((si,int(timeline[a]['start']*1000)))
chapter_starts.append((len(scene_ranges),TARGET))
for j in range(len(chapter_starts)-1):
    si,start=chapter_starts[j]
    stop=chapter_starts[j+1][1]
    dur=max(0,stop-start)
    if dur<=0: continue
    freq=tones[si%len(tones)]
    tone=Sine(freq).to_audio_segment(duration=dur,volume=-37)
    overtone=Sine(freq*1.5).to_audio_segment(duration=dur,volume=-44)
    layer=tone.overlay(overtone)
    # subtle breath/air
    if si in [0,1,2,3,4,5,14,15]:
        layer=layer.overlay(WhiteNoise().to_audio_segment(duration=dur,volume=-54))
    bed=bed.overlay(layer,position=start)

mix=bed.overlay(master.apply_gain(+1.0))
final=EXP/'genesis_francisca_10min.mp3'
mix.export(final,format='mp3',bitrate='64k',parameters=['-ac','1','-ar','24000'])
(EXP/'timeline.json').write_text(json.dumps({'duration':600,'voice':'pt-BR-FranciscaNeural','cues':timeline},ensure_ascii=False,indent=2),encoding='utf-8')

# Split base64 for connector-safe retrieval.
b64=base64.b64encode(final.read_bytes()).decode('ascii')
for old in EXP.glob('audio_b64_*.txt'): old.unlink()
CH=2400000
parts=[b64[i:i+CH] for i in range(0,len(b64),CH)]
for i,p in enumerate(parts,1):
    (EXP/f'audio_b64_{i:03d}.txt').write_text(p,encoding='ascii')
(EXP/'audio_parts.json').write_text(json.dumps({'parts':len(parts),'chars':len(b64),'bytes':final.stat().st_size},indent=2),encoding='utf-8')
print('speech_s',speech_ms/1000,'final_ms',len(master),'mp3_bytes',final.stat().st_size,'parts',len(parts))
