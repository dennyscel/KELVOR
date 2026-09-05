#!/usr/bin/env python3
"""Targeted CI diagnostic for SEAL_DAWN only.

Diagnostic-only acceleration: teleports the *test instance* to x=11950 after normal
scene creation. It never counts as campaign PASS and never changes packaged game
physics, lives, acceptance rules or persistent state.
"""
from __future__ import annotations
import argparse, json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--web',required=True);ap.add_argument('--chrome',required=True);ap.add_argument('--out',required=True)
    a=ap.parse_args();web=Path(a.web).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
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
        ready=False
        while time.monotonic()<deadline:
            time.sleep(.25)
            ready=bool(d.execute_script("return !!(window.__KELVOR_W01_L01_RC37_SCENE__?.player && window.__KELVOR_W01_L01_RC37_SCENE__?.autoplayRC37);"))
            if ready:break
        if not ready:raise SystemExit('scene/autoplay not ready')

        geometry=d.execute_script("""
          const s=window.__KELVOR_W01_L01_RC37_SCENE__;
          const primitiveData=(o)=>{const src=o?.data?.list||{},out={};for(const [k,v] of Object.entries(src))if(v===null||['string','number','boolean'].includes(typeof v))out[k]=v;return out;};
          const item=(o)=>({type:o?.constructor?.name||null,name:o?.name||null,x:Number.isFinite(o?.x)?o.x:null,y:Number.isFinite(o?.y)?o.y:null,displayWidth:Number.isFinite(o?.displayWidth)?o.displayWidth:null,displayHeight:Number.isFinite(o?.displayHeight)?o.displayHeight:null,texture:o?.texture?.key||null,frame:o?.frame?.name??null,active:o?.active??null,visible:o?.visible??null,depth:o?.depth??null,data:primitiveData(o),body:o?.body?{x:o.body.x,y:o.body.y,width:o.body.width,height:o.body.height,enable:o.body.enable,immovable:o.body.immovable}:null});
          const children=Array.from(s?.children?.list||[]).filter(o=>{const k=((o?.texture?.key||'')+' '+(o?.name||'')+' '+JSON.stringify(primitiveData(o))).toLowerCase();return (Number.isFinite(o?.x)&&o.x>=11700&&o.x<=13700)||k.includes('seal');}).map(item);
          const worldEntries=s?.physics?.world?.bodies?.entries ?? s?.physics?.world?.bodies ?? [];
          const bodies=Array.from(worldEntries||[]).map(b=>b?.gameObject).filter(Boolean).filter(o=>{const k=((o?.texture?.key||'')+' '+(o?.name||'')+' '+JSON.stringify(primitiveData(o))).toLowerCase();return (Number.isFinite(o?.x)&&o.x>=11700&&o.x<=13700)||k.includes('seal');}).map(item);
          const platforms=s?.platformTopByX?Array.from(s.platformTopByX.entries()).filter(([x])=>x>=11700&&x<=13700).map(([x,top])=>({x,top,centerY:top-(window.PlatformerSNESV04?.TUNING?.bodyHeight||0)/2})):[];
          const sealArrays={};for(const k of Object.keys(s||{}).filter(k=>/seal/i.test(k))){const v=s[k];if(Array.isArray(v))sealArrays[k]=v.slice(0,20).map(x=>x&&typeof x==='object'?item(x.sprite||x):x);else if(v===null||['string','number','boolean'].includes(typeof v))sealArrays[k]=v;}
          return {sceneKey:s?.scene?.key||null,platforms,children,bodies,sealArrays,sceneKeys:Object.keys(s||{}).filter(k=>/seal|platform/i.test(k)).sort()};
        """)
        (out/'GEOMETRY.json').write_text(json.dumps(geometry,ensure_ascii=False,indent=2),encoding='utf-8')

        d.execute_script("""
          const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player;
          p.actor.setPosition(11950,254);p.body.setVelocity(0,0);s.hearts=3;s.lifeCycle='active';
          if(p.body){p.body.reset(11950,254);p.body.setVelocity(0,0);}
          if(s.autoplayRC37){s.autoplayRC37.lastX=11950;s.autoplayRC37.lastProgressAt=s.time.now;}
          window.__KELVOR_TARGETED_SEAL1_DIAGNOSTIC__=true;
        """)
        start=time.monotonic();result=None;sample_no=0
        while time.monotonic()-start < 45:
            time.sleep(.15);sample_no+=1
            snap=d.execute_script("""
              const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s?.player,q=window.__KELVOR_W01_L01_RC37_QA__;
              return {x:p?.x??null,y:p?.y??null,vx:p?.velocityX??null,vy:p?.velocityY??null,grounded:p?.grounded??null,air:p?.airJumpsRemaining??null,hearts:s?.hearts??null,life:s?.lifeCycle??null,seals:s?.sealsCollectedRC37??null,qa:q||null};
            """)
            snap['sample']=sample_no;snap['elapsed']=round(time.monotonic()-start,3);samples.append(snap)
            if (snap.get('seals') or 0)>=1:result='SEAL1_COLLECTED';break
            if snap.get('life')=='gameover':result='GAME_OVER';break
            if (snap.get('x') or 0)>13620:result='SEAL1_MISSED';break
        if result is None:result='TIMEBOX'
        summary={'diagnostic_only':True,'counts_as_campaign_pass':False,'result':result,'elapsed':round(time.monotonic()-start,2),'sample_interval_s':.15,'geometry_file':'GEOMETRY.json','last':samples[-1] if samples else None}
        (out/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8');(out/'SAMPLES.json').write_text(json.dumps(samples,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(summary,ensure_ascii=False,indent=2))
        return 0 if result=='SEAL1_COLLECTED' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
