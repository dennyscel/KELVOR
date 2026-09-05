#!/usr/bin/env python3
"""Generic isolated seal diagnostic for KELVOR RC39.

Diagnostic-only helper for cloud/mobile continuity. It may reset/teleport the test
instance and pre-mark earlier seals/gates solely to isolate one target seal. Those
operations never count as campaign PASS and never alter packaged game files,
physics, collisions, lives, acceptance thresholds or persistent saves.
"""
from __future__ import annotations
import argparse, json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def csv(v: str):
    return [x.strip() for x in (v or '').split(',') if x.strip()]


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--web',required=True);ap.add_argument('--chrome',required=True);ap.add_argument('--out',required=True)
    ap.add_argument('--target-id',required=True);ap.add_argument('--start-x',type=float,required=True);ap.add_argument('--start-y',type=float,default=254)
    ap.add_argument('--precollect',default='');ap.add_argument('--open-gates',default='');ap.add_argument('--seconds',type=int,default=55)
    a=ap.parse_args();web=Path(a.web).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    pre=csv(a.precollect); gates=csv(a.open_gates)
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*x,**kw):super().__init__(*x,directory=str(web),**kw)
        def log_message(self,*x):pass
        def do_POST(self):
            n=int(self.headers.get('Content-Length','0'));self.rfile.read(n);self.send_response(204);self.end_headers()
    srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start();port=srv.server_address[1]
    url=f'http://127.0.0.1:{port}/index.html?rc37=1&campaignrc38=1&campaignfull=1&autotest=1&debug=1&campaignqa=1'
    o=Options();o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=1440,900']:o.add_argument(f)
    d=webdriver.Chrome(options=o);samples=[]
    try:
        d.get(url);deadline=time.monotonic()+25
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!(window.__KELVOR_W01_L01_RC37_SCENE__?.player && window.__KELVOR_W01_L01_RC37_SCENE__?.autoplayRC37);"):break
        else: raise SystemExit('scene/autoplay not ready')
        init=d.execute_script("""
          const cfg=arguments[0],s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player;
          for(const id of cfg.precollect){const q=s.sealsRC37?.find(x=>x.id===id);if(q&&!q.collected){q.collected=true;q.sprite?.destroy();}}
          s.sealsCollectedRC37=(s.sealsRC37||[]).filter(x=>x.collected).length;
          for(const id of cfg.gates){const g=s.lockGatesRC37?.find(x=>x.id===id);if(!g)continue;g.open=true;g.defeated=g.required;if(g.solid?.body)g.solid.body.enable=false;g.solid?.setActive(false);g.visual?.setAlpha(.16);}
          p.actor.setPosition(cfg.x,cfg.y);p.body.reset(cfg.x,cfg.y);p.body.setVelocity(0,0);s.hearts=3;s.lifeCycle='active';
          if(s.autoplayRC37){s.autoplayRC37.lastX=cfg.x;s.autoplayRC37.lastProgressAt=s.time.now;}
          window.__KELVOR_GENERIC_SEAL_DIAGNOSTIC__={...cfg,diagnosticOnly:true};
          return {seals:(s.sealsRC37||[]).map(q=>({id:q.id,collected:q.collected,x:q.sprite?.x??null,y:q.sprite?.y??null})),gates:(s.lockGatesRC37||[]).map(g=>({id:g.id,open:g.open,defeated:g.defeated,required:g.required}))};
        """,{'precollect':pre,'gates':gates,'x':a.start_x,'y':a.start_y,'target':a.target_id})
        (out/'INIT_STATE.json').write_text(json.dumps(init,ensure_ascii=False,indent=2),encoding='utf-8')
        start=time.monotonic();result='TIMEBOX'
        while time.monotonic()-start<a.seconds:
            time.sleep(.15)
            snap=d.execute_script("""
              const id=arguments[0],s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s?.player,q=window.__KELVOR_W01_L01_RC37_QA__,seal=s?.sealsRC37?.find(x=>x.id===id);
              return {target:id,targetCollected:!!seal?.collected,seals:s?.sealsCollectedRC37??null,x:p?.x??null,y:p?.y??null,vx:p?.velocityX??null,vy:p?.velocityY??null,grounded:p?.grounded??null,air:p?.airJumpsRemaining??null,hearts:s?.hearts??null,life:s?.lifeCycle??null,qa:q||null};
            """,a.target_id)
            snap['elapsed']=round(time.monotonic()-start,3);samples.append(snap)
            if snap.get('targetCollected'):result='TARGET_SEAL_COLLECTED';break
            if snap.get('life')=='gameover':result='GAME_OVER';break
            if (snap.get('x') or 0)>a.start_x+2500:result='TARGET_REGION_MISSED';break
        summary={'diagnostic_only':True,'counts_as_campaign_pass':False,'target_id':a.target_id,'precollect':pre,'open_gates':gates,'result':result,'elapsed':round(time.monotonic()-start,2),'last':samples[-1] if samples else None}
        (out/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8');(out/'SAMPLES.json').write_text(json.dumps(samples,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(summary,ensure_ascii=False,indent=2))
        return 0 if result=='TARGET_SEAL_COLLECTED' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()

if __name__=='__main__':raise SystemExit(main())
