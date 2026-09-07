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
    d=webdriver.Chrome(options=o);result={}
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?v=032');deadline=time.monotonic()+30
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_RC39_OWNER_EXPERIENCE_V032_READY__ && !!window.__KELVOR_MAIN_MENU_V032__;"):break
        else: raise SystemExit('v032/main menu not ready')
        time.sleep(.5);d.save_screenshot(str(out/'menu.png'))
        menu=d.execute_script("""
          const s=window.__KELVOR_MAIN_MENU_V032__,A=window.PlatformerSNESV04.AudioServiceRC25;
          const texts=(s.children?.list||[]).filter(o=>o?.type==='Text').map(o=>o.text);
          return {screen:document.documentElement.dataset.kelvorScreen,currentCue:A?.currentCue||null,hasPlay:texts.includes('JOGAR AGORA'),hasFullscreen:texts.includes('TELA CHEIA')};
        """);result['menu']=menu
        d.execute_script("window.__KELVOR_MAIN_MENU_V032__.startAdventure(false)");deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_CAMPAIGN_MAP_SCENE__?.__ownerMapV032;"):break
        else: raise SystemExit('v032 map not ready')
        time.sleep(.5);d.save_screenshot(str(out/'map.png'))
        mp=d.execute_script("""
          const s=window.__KELVOR_CAMPAIGN_MAP_SCENE__,b=s.__ownerMapV032?.mapBounds||null,A=window.PlatformerSNESV04.AudioServiceRC25;
          const ns=Object.entries(s.nodes||{}).map(([id,o])=>({id,x:o.x,y:o.y}));
          const inside=b?ns.every(n=>n.x>=b.left-4&&n.x<=b.left+b.width+4&&n.y>=b.top-4&&n.y<=b.top+b.height+4):false;
          return {responsive:!!s.__ownerMapV032?.responsive,bounds:b,nodes:ns,nodesInsideArtwork:inside,currentCue:A?.currentCue||null};
        """);result['map']=mp
        d.get(f'http://127.0.0.1:{port}/index.html?rc37=1&debug=1&v=032');deadline=time.monotonic()+30
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_W01_L01_RC37_SCENE__ && !!window.__KELVOR_RC39_OWNER_EXPERIENCE_V032_READY__;"):break
        else: raise SystemExit('v032 W01 scene not ready')
        cam_before=d.execute_script("return window.__KELVOR_W01_L01_RC37_SCENE__.cameras.main.scrollY")
        d.execute_script("""const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player;p.actor.setPosition(7000,80);p.body.reset(7000,80);p.body.setVelocity(120,-180);""")
        time.sleep(1.0)
        camera=d.execute_script("""const s=window.__KELVOR_W01_L01_RC37_SCENE__,c=s.cameras.main;return {before:arguments[0],after:c.scrollY,followOffsetY:c.followOffset.y,owner:s.__ownerV032||null};""",cam_before)
        result['camera']=camera;d.save_screenshot(str(out/'camera_high.png'))
        vine_start=d.execute_script("""
          const s=window.__KELVOR_W01_L01_RC37_SCENE__,z=s.climbZonesV032?.[1]||s.climbZonesV032?.[0],p=s.player;
          const y=(z?.bottom||316)-34;p.actor.setPosition(z.x,y);p.body.reset(z.x,y);p.body.setVelocity(0,0);s.router.setVirtualAxis(0,-1);
          return {id:z.id,x:z.x,startY:y,top:z.top,bottom:z.bottom};
        """)
        time.sleep(1.25)
        vine_end=d.execute_script("""const s=window.__KELVOR_W01_L01_RC37_SCENE__,p=s.player;s.router.setVirtualAxis(0,0);return {endY:p.y,active:!!p.climbStateV09?.active,reason:p.climbStateV09?.reason||null};""")
        result['vine']={**vine_start,**vine_end,'rise':round(vine_start['startY']-vine_end['endY'],2)};d.save_screenshot(str(out/'vine_climb.png'))
        gate=d.execute_script("""const s=window.__KELVOR_W01_L01_RC37_SCENE__,g=s.lockGatesRC37?.[0];g.defeated=g.required;s.updateArenaGatesRC37();return {id:g.id,open:g.open};""")
        time.sleep(.7)
        gate2=d.execute_script("""const s=window.__KELVOR_W01_L01_RC37_SCENE__,g=s.lockGatesRC37?.[0];return {open:g.open,visualActive:g.visual?.active??false,visualVisible:g.visual?.visible??false,alpha:g.visual?.alpha??0};""")
        result['gate']={**gate,**gate2};d.save_screenshot(str(out/'gate_open.png'))
        ok=(menu.get('hasPlay') and menu.get('hasFullscreen') and menu.get('currentCue')=='MUS_P1_EXPLORE_A' and mp.get('responsive') and mp.get('nodesInsideArtwork') and mp.get('currentCue')=='MUS_P1_EXPLORE_A' and abs(camera.get('after',999))<1e-6 and abs(camera.get('followOffsetY',999))<1e-6 and result['vine']['rise']>28 and gate2.get('open') and (not gate2.get('visualActive') or not gate2.get('visualVisible') or gate2.get('alpha',1)<.05))
        result['status']='PASS' if ok else 'FAIL';(out/'RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=False,indent=2));return 0 if ok else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()

if __name__=='__main__':raise SystemExit(main())
