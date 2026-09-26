#!/usr/bin/env python3
import asyncio, json, pathlib, sys
from mutagen.mp3 import MP3
import edge_tts

VOICE="pt-BR-FranciscaNeural"
BASE_RATE=.95
PITCH="+0Hz"

async def synth(text, vel, path, attempts=6):
    rate=f"{round((BASE_RATE*float(vel)-1)*100):+d}%"
    last=None
    for n in range(attempts):
        try:
            c=edge_tts.Communicate(text,VOICE,rate=rate,pitch=PITCH)
            await c.save(str(path))
            if path.exists() and path.stat().st_size>500:
                return
        except Exception as e:
            last=e
        await asyncio.sleep(2+n*3)
    raise RuntimeError(f"TTS failed: {text[:80]} :: {last}")

async def main():
    src=pathlib.Path("chatgpt_genesis/roteiro.json")
    out=pathlib.Path("chatgpt_genesis/out")
    out.mkdir(parents=True,exist_ok=True)
    roteiro=json.loads(src.read_text(encoding="utf-8"))
    falas=[f for cena in roteiro for f in cena["falas"]]
    clips=[]
    for i,f in enumerate(falas,1):
        p=out/f"fala_{i:03d}.mp3"
        print(f"[{i:03d}/{len(falas)}] {f['t']}",flush=True)
        await synth(f["t"],f.get("v",1),p)
        dur=float(MP3(p).info.length)
        clips.append({"file":p.name,"dur":round(dur,4),"text":f["t"]})
        await asyncio.sleep(.15)
    (out/"clips.json").write_text(json.dumps({"voice":VOICE,"base_rate":BASE_RATE,"clips":clips},ensure_ascii=False,indent=2),encoding="utf-8")
if __name__=="__main__":
    asyncio.run(main())
