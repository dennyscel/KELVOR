#!/usr/bin/env python3
"""Physics-only CI tuner for RC37 SEAL_DAWN stage 2.

Diagnostic instrumentation only. Each trial resets the test instance to the measured
natural launch state at the 12690 ledge and drives the existing input router. No
trial is a campaign PASS and no game physics/collision/save rule is changed.
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
    d=webdriver.Chrome(options=o);d.set_script_timeout(220)
    try:
        d.get(url);deadline=time.monotonic()+25
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!(window.__KELVOR_W01_L01_RC37_SCENE__?.player && window.__KELVOR_W01_L01_RC37_SCENE__?.router);"):break
        else: raise SystemExit('scene/router not ready')

        # Measured from the real v020 run: primary at x12682, late double at x12790,
        # ~517 ms later; v020 used 380/300 ms holds and overshot. PlayerController
        # source also shows a 420 ms runDelay, so each trial explicitly preserves the
        # already-held direction state that exists in the natural campaign route.
        params=[]
        for dh in [120,140,160,180,200,220,240]:
            for bx in [12970,13005,13040]:
                for ba in [-0.35,0.0,0.18]:
                    params.append({'doubleHoldMs':dh,'brakeX':bx,'brakeAxis':ba})

        results=d.execute_async_script("""
          const ps=arguments[0],done=arguments[arguments.length-1];
          const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player,r=s.router,P=window.PlatformerSNESV04;
          const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
          const cy=x=>s.platformTopByX.get(x)-P.TUNING.bodyHeight/2;
          if(s.autoplayRC37)s.autoplayRC37.status='DIAG_TUNER_PAUSED';
          if(s.autoPilot)s.autoPilot.status='DIAG_TUNER_PAUSED';
          async function trial(par,idx){
            r.resetVirtual();p.actor.setPosition(12682,cy(12690));p.body.reset(12682,cy(12690));p.body.setVelocity(0,0);
            await sleep(150);r.resetVirtual();await sleep(50);
            // Natural stage-2 telemetry: vx ~=118 immediately before launch. The real
            // route has already held right for far longer than runDelayMs=420, so do not
            // restart the controller's walk-delay state between synthetic trial resets.
            p.moveInputDir=1;p.moveHeldSince=s.time.now-1000;p.body.setVelocityX(118);
            const targetY=cy(13040),trace=[];let airborne=false,doubleDone=false,doubleUntil=0;
            const t0=performance.now(),primaryUntil=t0+380;
            r.setVirtualAxis(1,0);r.setVirtual('jump',true);
            while(performance.now()-t0<3000){
              await sleep(16);const now=performance.now(),x=p.x,y=p.y,vy=p.velocityY;
              if(!p.grounded)airborne=true;
              if(!doubleDone&&now>=primaryUntil)r.setVirtual('jump',false);
              if(airborne&&!doubleDone&&!p.grounded&&p.airJumpsRemaining>0&&x>=12790&&vy>50){doubleDone=true;doubleUntil=now+par.doubleHoldMs;r.setVirtual('jump',true);}
              if(doubleDone&&now>=doubleUntil)r.setVirtual('jump',false);
              const axis=x<par.brakeX?1:par.brakeAxis;r.setVirtualAxis(axis,0);
              if(trace.length<170)trace.push({ms:Math.round(now-t0),x:+x.toFixed(2),y:+y.toFixed(2),vx:+p.velocityX.toFixed(2),vy:+vy.toFixed(2),g:!!p.grounded,air:p.airJumpsRemaining,axis,doubleDone});
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
        summary={'diagnostic_only':True,'counts_as_campaign_pass':False,'launch_state':{'x':12682,'platformX':12690,'initialVx':118,'moveHeldMs':1000,'runDelayMs':420,'primaryHoldMs':380,'doubleTriggerX':12790,'doubleVyMin':50},'trial_count':len(results),'result_counts':counts,'success_count':len(winners),'best':winners[:12]}
        (out/'TUNER_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
        (out/'TUNER_TRIALS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(summary,ensure_ascii=False,indent=2))
        return 0 if winners else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
