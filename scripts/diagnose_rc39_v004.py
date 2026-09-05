#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def main() -> int:
    ap=argparse.ArgumentParser()
    ap.add_argument('--web', required=True)
    ap.add_argument('--chrome', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--seconds', type=int, default=45)
    args=ap.parse_args()
    web=Path(args.web).resolve(); out=Path(args.out).resolve(); out.mkdir(parents=True, exist_ok=True)
    posts=[]
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*a,**kw): super().__init__(*a,directory=str(web),**kw)
        def do_POST(self):
            if self.path!='/__kelvor_campaign_result': self.send_error(404); return
            n=int(self.headers.get('Content-Length','0')); raw=self.rfile.read(n)
            try: data=json.loads(raw.decode('utf-8'))
            except Exception: data={'raw':raw.decode('utf-8','replace')}
            posts.append(data); (out/'POST_RESULT.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
            self.send_response(204); self.end_headers()
        def log_message(self,fmt,*a):
            with (out/'SERVER.log').open('a',encoding='utf-8') as f: f.write((fmt%a)+'\n')
    srv=ThreadingHTTPServer(('127.0.0.1',0),H); port=srv.server_address[1]
    threading.Thread(target=srv.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{port}/index.html?rc37=1&campaignrc38=1&campaignfull=1&autotest=1&debug=1&campaignqa=1'
    opts=Options(); opts.binary_location=args.chrome
    for flag in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=1440,900']:
        opts.add_argument(flag)
    opts.set_capability('goog:loggingPrefs', {'browser':'ALL'})
    driver=None; snapshots=[]
    try:
        driver=webdriver.Chrome(options=opts); driver.set_page_load_timeout(60); driver.get(url)
        start=time.monotonic()
        for i in range(max(1,args.seconds)):
            time.sleep(1)
            try:
                snap=driver.execute_script("""
                  const g=window.__KELVOR_CAMPAIGN_INTEGRATED_GAUNTLET_RC39_V004__||window.__KELVOR_CAMPAIGN_INTEGRATED_GAUNTLET_RC39_V005__||null;
                  const qa=window.__KELVOR_W01_L01_RC37_QA__||null;
                  const s=window.__KELVOR_W01_L01_RC37_SCENE__||window.__PLATFORMER_SCENE_V04__||null;
                  return {href:location.href,ready:document.readyState,gauntlet:g?{enabled:g.enabled,status:g.status,samples:g.samples?.length||0,errors:g.errors||[],finished:!!g.__finished,posted:!!g.__posted}:null,qa:qa,scene:s?{key:s.scene?.key||null,x:s.player?.x||null,y:s.player?.y||null,goal:!!s.goalReached,lifeCycle:s.lifeCycle||null,hearts:s.hearts??null,deaths:s.deathSerial??null,lastDeathReason:s.lastDeathReason||null,lastDamageSource:s.lastDamageSource||null}:null,presentationReady:window.__KELVOR_GLOBAL_PRESENTATION_RC39_READY__===true,campaignHeroReady:window.__KELVOR_CAMPAIGN_RC38_READY__===true,autoplayV005Ready:window.__KELVOR_RC39_V005_AUTOPLAY_PATCH_READY__===true};
                """)
            except Exception as e:
                snap={'selenium_eval_error':repr(e)}
            snap['second']=i+1; snapshots.append(snap)
            if posts: break
        logs=[]
        try: logs=driver.get_log('browser')
        except Exception as e: logs=[{'level':'DRIVER','message':repr(e)}]
        (out/'SNAPSHOTS.json').write_text(json.dumps(snapshots,ensure_ascii=False,indent=2),encoding='utf-8')
        (out/'BROWSER_LOG.json').write_text(json.dumps(logs,ensure_ascii=False,indent=2),encoding='utf-8')
        summary={'url':url,'seconds':round(time.monotonic()-start,2),'post_received':bool(posts),'last_snapshot':snapshots[-1] if snapshots else None,'browser_log_count':len(logs),'severe':[x for x in logs if x.get('level')=='SEVERE']}
        (out/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(summary,ensure_ascii=False,indent=2))
    finally:
        if driver:
            try: driver.quit()
            except Exception: pass
        srv.shutdown(); srv.server_close()
    return 0

if __name__=='__main__': raise SystemExit(main())
