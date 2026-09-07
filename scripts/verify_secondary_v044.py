#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--web',required=True);ap.add_argument('--chrome',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    web=Path(a.web).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*x,**kw):super().__init__(*x,directory=str(web),**kw)
        def log_message(self,*x):pass
    srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start();port=srv.server_address[1]
    o=Options();o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=430,932']:o.add_argument(f)
    d=webdriver.Chrome(options=o);R={'checks':{},'status':'FAIL'}
    def wait(js,t=12):
        end=time.monotonic()+t
        while time.monotonic()<end:
            time.sleep(.15)
            try:
                if d.execute_script(js):return True
            except Exception:pass
        return False
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?v=044marker')
        if not wait("return !!window.__KELVOR_MAIN_MENU_V043__&&window.__KELVOR_MAIN_MENU_V043__.scene?.isActive?.()===true;"):raise SystemExit('menu not ready')
        R['checks']['menu_story']=bool(d.execute_script("return !!window.__KELVOR_MAIN_MENU_V043__.__storyWorldV043&&!!window.__KELVOR_MAIN_MENU_V043__.__v043?.menuStoryFallback;"))
        d.execute_script("window.__KELVOR_MAIN_MENU_V043__.scene.start('OptionsSceneV10')")
        if not wait("return !!window.__KELVOR_OPTIONS_V044__?.scene?.isActive?.()===true;"):raise SystemExit('options v044 not ready')
        R['checks']['options_v044']=bool(d.execute_script("const s=window.__KELVOR_OPTIONS_V044__;return !!s.__v044?.optionsFinish&&!!s.__optionsFinishV044?.art&&s.__optionsFinishV044.chips?.length===4;"))
        d.execute_script("window.__KELVOR_OPTIONS_V044__.__backV034.press()")
        if not wait("return !!window.__KELVOR_MAIN_MENU_V043__?.scene?.isActive?.()===true;"):raise SystemExit('menu return failed')
        d.execute_script("window.__KELVOR_MAIN_MENU_V043__.scene.start('MusicPlayerSceneV10')")
        if not wait("return !!window.__KELVOR_MUSIC_V044__?.scene?.isActive?.()===true;"):raise SystemExit('music v044 not ready')
        R['checks']['music_v044']=bool(d.execute_script("const s=window.__KELVOR_MUSIC_V044__;return !!s.__v044?.musicFinish&&s.__musicFinishV044?.bars?.length===13&&!!s.__musicFinishV044?.card;"))
        d.execute_script("window.__KELVOR_MUSIC_V044__.__backV034.press()")
        if not wait("return !!window.__KELVOR_MAIN_MENU_V043__?.scene?.isActive?.()===true;"):raise SystemExit('menu return 2 failed')
        d.execute_script("window.__KELVOR_MAIN_MENU_V043__.scene.start('CreditsSceneV10')")
        if not wait("return !!window.__KELVOR_CREDITS_V044__?.scene?.isActive?.()===true;"):raise SystemExit('credits v044 not ready')
        R['checks']['credits_v044']=bool(d.execute_script("const s=window.__KELVOR_CREDITS_V044__;return !!s.__v044?.creditsFinish&&s.__creditsFinishV044?.stars?.length===7&&!!s.__creditsFinishV044?.card;"))
        R['status']='PASS' if all(R['checks'].values()) else 'FAIL'
        (out/'SECONDARY_V044.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
