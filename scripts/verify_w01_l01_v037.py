#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,threading,time
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

SECTIONS=[('01_dawn',1800),('02_rootfall',5600),('03_hollow',9200),('04_canopy',12900),('05_sunken',16900),('06_spirit',20700),('07_twin',24600),('08_ancient',28600),('09_guardian',32700),('10_finale',36500)]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--web',required=True);ap.add_argument('--chrome',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    web=Path(a.web).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*x,**kw):super().__init__(*x,directory=str(web),**kw)
        def log_message(self,*x):pass
        def do_POST(self):n=int(self.headers.get('Content-Length','0'));self.rfile.read(n);self.send_response(204);self.end_headers()
    srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start();port=srv.server_address[1]
    o=Options();o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=1536,691']:o.add_argument(f)
    d=webdriver.Chrome(options=o);R={'checks':{},'screenshots':[],'status':'FAIL'}
    def shot(n):d.save_screenshot(str(out/n));R['screenshots'].append(n)
    def tp(x,y=254,wait=.28):
        d.execute_script("""const s=window.__KELVOR_W01_L01_V037__,p=s.player;p.actor.setPosition(arguments[0],arguments[1]);p.body.reset(arguments[0],arguments[1]);s.cameras.main.centerOn(arguments[0],180);s.cameras.main.scrollY=0;""",x,y);time.sleep(wait)
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?rc37=1&v=037qa');deadline=time.monotonic()+35
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_RC39_W01L01_V037_READY__&&!!window.__KELVOR_W01_L01_V037__&&window.__KELVOR_W01_L01_V037__.scene?.isActive?.()===true;"):break
        else:raise SystemExit('v037 scene not ready')
        time.sleep(.8)
        core=d.execute_script("""
          const s=window.__KELVOR_W01_L01_V037__,kids=s.children?.list||[],grounds=kids.filter(o=>o.__groundSurfaceV036);
          let maxErr=0;for(const o of grounds){const m=o.__groundSurfaceV036,top=o.y-o.displayHeight+(m.topPx*(o.scaleY||1));maxErr=Math.max(maxErr,Math.abs(top-m.surfaceY));}
          return {life:s.lifeCycle,v36:s.__v036||null,v37:s.__v037||null,groundCount:grounds.length,maxErr,ravines:(s.__ravinesV036||[]).length,props:(s.__solidLandmarksV036||[]).length,extra:(s.enemies||[]).filter(e=>e.__densityV036).length,sectionArt:(s.__sectionArtV037||[]).length,ravineArt:(s.__ravineArtV037||[]).length,supports:(s.__ancientSupportsV037||[]).length,arches:(s.__gateArchitectureV037||[]).length};
        """)
        R['core']=core
        R['checks']['v036_core_preserved']=bool(core.get('v36',{}).get('terrainAligned') and core.get('v36',{}).get('keyDoors'))
        R['checks']['v037_ready']=bool(core.get('v37',{}).get('ready') and core.get('life')=='active')
        R['checks']['ground_zero_error']=float(core.get('maxErr',99))<=1.1 and core.get('groundCount',0)>100
        R['checks']['ten_ravines_preserved']=core.get('ravines')==10
        R['checks']['ten_solid_landmarks_preserved']=core.get('props')==10
        R['checks']['four_density_enemies_preserved']=core.get('extra')==4
        R['checks']['ten_section_identities']=core.get('v37',{}).get('sectionIdentities')==10 and core.get('sectionArt',0)>=90
        R['checks']['ravine_art_enriched']=core.get('ravineArt',0)>=80
        R['checks']['ancient_supports_5']=core.get('supports')==5
        R['checks']['gate_architecture_3']=core.get('arches')==3

        # Production-like visual scan: no debug query or debug panel.
        for name,x in SECTIONS:
            tp(x);shot('section_'+name+'.png')
        for name,x in [('ravine_rootfall',4175),('ravine_canopy',11672),('ravine_ancient',28070)]:
            tp(x-90);time.sleep(.5);shot(name+'.png')
        tp(12720,80);shot('platform_high.png')
        cam=d.execute_script("const s=window.__KELVOR_W01_L01_V037__;return {scrollY:s.cameras.main.scrollY,offset:s.cameras.main.followOffset?.y??0};")
        R['camera']=cam;R['checks']['vertical_camera_lock']=abs(float(cam.get('scrollY',999)))<.5

        # Door/key sequence still must work after art pass.
        tp(10320);shot('gate_locked.png')
        spawn=d.execute_script("""const s=window.__KELVOR_W01_L01_V037__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');g.defeated=g.required;s.updateArenaGatesRC37();return {spawn:g.keySpawned,open:g.open};""")
        R['checks']['key_before_door']=bool(spawn.get('spawn') and not spawn.get('open'));tp(10170,238);d.execute_script("window.__KELVOR_W01_L01_V037__.updateArenaGatesRC37();");time.sleep(.3);shot('gate_key.png')
        tp(10375);d.execute_script("""const s=window.__KELVOR_W01_L01_V037__;s.router.virtual.attack=true;s.__prevAttackV036=false;s.updateArenaGatesRC37();s.router.virtual.attack=false;""");time.sleep(.12);shot('gate_insert.png');time.sleep(1.0);shot('gate_open.png')
        door=d.execute_script("""const s=window.__KELVOR_W01_L01_V037__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');return {open:g.open,consumed:g.keyConsumed,solid:!!g.solid?.body?.enable,visible:!!g.visual?.visible,alpha:g.visual?.alpha??0,arch:!!g.__archV037};""")
        R['door']=door;R['checks']['door_ceremony_preserved']=bool(door.get('open') and door.get('consumed') and not door.get('solid') and door.get('visible') and float(door.get('alpha',0))>.9 and door.get('arch'))

        snap=d.execute_script("return window.__KELVOR_W01_L01_V037__.rc37Snapshot();")
        R['checks']['snapshot_v037']=bool(isinstance(snap,dict) and snap.get('ownerV037',{}).get('ready'))
        vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2);R['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
