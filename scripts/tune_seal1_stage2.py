#!/usr/bin/env python3
"""Physics-only CI tuner for RC37 SEAL_DAWN stage 2.

Diagnostic instrumentation only. Trials use the real PlayerController/input router,
starting on the authored 12690 platform with natural run momentum. Teleport/reset is
used only between trials and never counts as campaign PASS.
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
    d=webdriver.Chrome(options=o);d.set_script_timeout(180)
    try:
        d.get(url);deadline=time.monotonic()+25
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!(window.__KELVOR_W01_L01_RC37_SCENE__?.player && window.__KELVOR_W01_L01_RC37_SCENE__?.router);"):break
        else: raise SystemExit('scene/router not ready')

        # Physics-source facts: body 34x64, run 235, air accel 950, jump -585,
        # double -535, gravity 1750, cut x0.5. Runtime geometry: platform centers
        # 12690 -> 13040, widths ~65.9 -> 63.1. The v020 launch at x12682 and
        # double at x12790 is physically short. Sweep later safe launch/double points.
        params=[]
        for launch_x in [12695,12705,12715,12725]:
            for double_x in [12810,12825,12840,12855]:
                for dh in [180,210,240]:
                    params.append({'launchX':launch_x,'doubleX':double_x,'doubleHoldMs':dh})

        results=d.execute_async_script("""
          const ps=arguments[0],done=arguments[arguments.length-1];
          const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player,r=s.router,P=window.PlatformerSNESV04;
          const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
          const cy=x=>s.platformTopByX.get(x)-P.TUNING.bodyHeight/2;
          if(s.autoplayRC37)s.autoplayRC37.status='DIAG_TUNER_PAUSED';
          if(s.autoPilot)s.autoPilot.status='DIAG_TUNER_PAUSED';
          async function trial(par,idx){
            r.resetVirtual();p.actor.setPosition(12682,cy(12690));p.body.reset(12682,cy(12690));p.body.setVelocity(0,0);
            await sleep(130);r.resetVirtual();await sleep(40);
            p.moveInputDir=1;p.moveHeldSince=s.time.now-1000;p.body.setVelocityX(118);
            const targetY=cy(13040),trace=[];let primaryDone=false,doubleDone=false,doubleUntil=0,primaryUntil=0,airborne=false;
            const t0=performance.now();r.setVirtualAxis(1,0);r.setVirtual('jump',false);
            while(performance.now()-t0<2500){
              await sleep(16);const now=performance.now(),x=p.x,y=p.y,vy=p.velocityY;
              if(!primaryDone&&p.grounded&&x>=par.launchX){primaryDone=true;primaryUntil=now+380;r.setVirtual('jump',true);}
              if(primaryDone&&!doubleDone&&now>=primaryUntil)r.setVirtual('jump',false);
              if(!p.grounded)airborne=true;
              if(primaryDone&&airborne&&!doubleDone&&!p.grounded&&p.airJumpsRemaining>0&&x>=par.doubleX&&vy>50){doubleDone=true;doubleUntil=now+par.doubleHoldMs;r.setVirtual('jump',true);}
              if(doubleDone&&now>=doubleUntil)r.setVirtual('jump',false);
              r.setVirtualAxis(1,0);
              if(trace.length<150)trace.push({ms:Math.round(now-t0),x:+x.toFixed(2),y:+y.toFixed(2),vx:+p.velocityX.toFixed(2),vy:+vy.toFixed(2),g:!!p.grounded,air:p.airJumpsRemaining,primaryDone,doubleDone});
              if(airborne&&p.grounded&&Math.abs(y-targetY)<16&&Math.abs(x-13040)<82){r.resetVirtual();return {...par,idx,result:'LANDED_13040',landingX:+x.toFixed(2),landingY:+y.toFixed(2),elapsedMs:Math.round(now-t0),trace};}
              if(airborne&&p.grounded&&y>200){r.resetVirtual();return {...par,idx,result:x<12970?'GROUND_SHORT':'GROUND_MISS',landingX:+x.toFixed(2),landingY:+y.toFixed(2),elapsedMs:Math.round(now-t0),trace};}
              if(x>13170){r.resetVirtual();return {...par,idx,result:'OVERSHOOT',landingX:+x.toFixed(2),landingY:+y.toFixed(2),elapsedMs:Math.round(now-t0),trace};}
            }
            r.resetVirtual();return {...par,idx,result:'TIMEBOX',landingX:+p.x.toFixed(2),landingY:+p.y.toFixed(2),trace};
          }
          (async()=>{const out=[];for(let i=0;i<ps.length;i++)out.push(await trial(ps[i],i));done(out);})().catch(e=>done({error:String(e),stack:e?.stack||null}));
        """,params)
        if isinstance(results,dict) and results.get('error'): raise RuntimeError(results['error'])
        winners=[r for r in results if r.get('result')=='LANDED_13040']
        winners.sort(key=lambda r:(abs(r['landingX']-13040),r['elapsedMs']))
        counts={}
        for r in results: counts[r.get('result','UNKNOWN')]=counts.get(r.get('result','UNKNOWN'),0)+1
        summary={'diagnostic_only':True,'counts_as_campaign_pass':False,'physics':{'gravityY':1750,'runSpeed':235,'airAcceleration':950,'jumpVelocity':-585,'doubleJumpVelocity':-535,'jumpCutMultiplier':0.5,'bodyWidth':34,'bodyHeight':64},'launch_state':{'resetX':12682,'platformX':12690,'initialVx':118,'moveHeldMs':1000},'trial_count':len(results),'result_counts':counts,'success_count':len(winners),'best':winners[:12]}
        (out/'TUNER_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
        (out/'TUNER_TRIALS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(summary,ensure_ascii=False,indent=2))
        return 0 if winners else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
