#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,threading,time
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--web',required=True);ap.add_argument('--chrome',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    web=Path(a.web).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*x,**kw):super().__init__(*x,directory=str(web),**kw)
        def log_message(self,*x):pass
        def do_POST(self):
            n=int(self.headers.get('Content-Length','0'));self.rfile.read(n);self.send_response(204);self.end_headers()
    srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start();port=srv.server_address[1]
    o=Options();o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=1536,691']:o.add_argument(f)
    d=webdriver.Chrome(options=o);errors=[]
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?rc37=1&debug=1');deadline=time.monotonic()+25
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_W01_L01_RC37_SCENE__ && !!window.__KELVOR_RC39_OWNER_VISUAL_V031_READY__;"):break
        else: raise SystemExit('v031/scene not ready')
        result=d.execute_script("""
          const s=window.__KELVOR_W01_L01_RC37_SCENE__,P=window.PlatformerSNESV04;
          const kids=Array.from(s.children?.list||[]);
          const bg=kids.filter(o=>o?.active&&Number.isFinite(o.depth)&&o.depth>=-40&&o.depth<=-24);
          const badY=bg.filter(o=>typeof o.scrollFactorY==='number'&&Math.abs(o.scrollFactorY)>1e-6).map(o=>({type:o.type,depth:o.depth,sfy:o.scrollFactorY,tex:o.texture?.key||null}));
          const opaqueMountainOverlays=kids.filter(o=>o?.active&&o.depth===-33&&o.texture?.key===P.PHASE01_TEXTURE).length;
          const toneSlabs=kids.filter(o=>o?.active&&o.depth===-34&&o.type==='Rectangle').length;
          const g=s.lockGatesRC37?.[0];
          const gateBefore=g?{open:g.open,defeated:g.defeated,required:g.required,label:g.__ownerLabelV031?.text||null}:null;
          if(g){s.player.actor.setPosition(g.x-150,254);s.player.body.reset(g.x-150,254);s.updateArenaGatesRC37();}
          const gateNear=g?{alpha:g.__ownerLabelV031?.alpha??null,text:g.__ownerLabelV031?.text||null}:null;
          const goal=(s.coins||[]).find(c=>c.goal);let earlyGoal=null;
          if(goal){
            goal.collected=false;s.sealsCollectedRC37=0;
            for(const q of s.lockGatesRC37||[])q.open=false;
            s.player.actor.setPosition(goal.sprite.x,goal.sprite.y);s.player.body.reset(goal.sprite.x,goal.sprite.y);s.updateCoinsAndGoal();
            earlyGoal={collected:goal.collected,goalReached:!!s.goalReached,hint:s.__goalHintV031?.text||null};
          }
          return {patch:!!window.__KELVOR_RC39_OWNER_VISUAL_V031_READY__,owner:s.__ownerVisualV031||null,bgCount:bg.length,badY,opaqueMountainOverlays,toneSlabs,gateBefore,gateNear,earlyGoal};
        """)
        # capture a high-jump style camera view at two world positions to preserve visual evidence
        for name,x,y in [('jump_early',7000,92),('jump_late',30000,92),('gate_a',10330,254)]:
            d.execute_script("""const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player;p.actor.setPosition(arguments[0],arguments[1]);p.body.reset(arguments[0],arguments[1]);""",x,y)
            time.sleep(.75);d.save_screenshot(str(out/f'{name}.png'))
        ok=(result.get('patch') and result.get('owner',{}).get('backgroundVerticalLocked') and not result.get('badY') and result.get('opaqueMountainOverlays')==0 and result.get('toneSlabs')==0 and (result.get('gateNear') or {}).get('alpha',0)>0 and 'PORTÃO SELADO' in ((result.get('gateNear') or {}).get('text') or '') and (result.get('earlyGoal') or {}).get('collected') is False and (result.get('earlyGoal') or {}).get('goalReached') is False)
        result['status']='PASS' if ok else 'FAIL';(out/'RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));return 0 if ok else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()

if __name__=='__main__':raise SystemExit(main())
