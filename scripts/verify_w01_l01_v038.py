#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,threading,time
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

SAFE_SECTIONS=[('01_dawn',1350),('02_rootfall',5200),('03_hollow',9200),('04_canopy',12900),('05_sunken',16500),('06_spirit',20500),('07_twin',24600),('08_ancient_exit',29250),('09_guardian',32000),('10_finale',36500)]
PITS=[('ravine_rootfall',4110,4240),('ravine_canopy',11620,11725),('ravine_ancient',27460,28680)]

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
    def tp(x,y=254,follow=False):
        d.execute_script("""const s=window.__KELVOR_W01_L01_V038__,p=s.player;p.actor.setPosition(arguments[0],arguments[1]);p.body.reset(arguments[0],arguments[1]);if(arguments[2]){s.cameras.main.startFollow(p.actor,true,.12,0);s.cameras.main.followOffset.set(0,0);}else{s.cameras.main.stopFollow();s.cameras.main.centerOn(arguments[0],180);}s.cameras.main.scrollY=0;""",x,y,follow);time.sleep(.35)
    def view(center,playerx):
        d.execute_script("""const s=window.__KELVOR_W01_L01_V038__,p=s.player;s.cameras.main.stopFollow();p.actor.setPosition(arguments[1],254);p.body.reset(arguments[1],254);s.cameras.main.centerOn(arguments[0],180);s.cameras.main.scrollY=0;""",center,playerx);time.sleep(.45)
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?rc37=1&v=038qa');deadline=time.monotonic()+35
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_RC39_W01L01_V038_READY__&&!!window.__KELVOR_W01_L01_V038__&&window.__KELVOR_W01_L01_V038__.scene?.isActive?.()===true;"):break
        else:raise SystemExit('v038 scene not ready')
        time.sleep(.8)
        core=d.execute_script("""
          const s=window.__KELVOR_W01_L01_V038__,kids=s.children?.list||[],grounds=kids.filter(o=>o.__groundSurfaceV036);let maxErr=0;for(const o of grounds){const m=o.__groundSurfaceV036,top=o.y-o.displayHeight+m.topPx*(o.scaleY||1);maxErr=Math.max(maxErr,Math.abs(top-m.surfaceY));}
          return {life:s.lifeCycle,v36:s.__v036||null,v37:s.__v037||null,v38:s.__v038||null,maxErr,groundCount:grounds.length,ravines:(s.__ravinesV036||[]).length,props:(s.__solidLandmarksV036||[]).length,extra:(s.enemies||[]).filter(e=>e.__densityV036).length,forest:(s.__forestFinishV038||[]).length,ravineFinish:(s.__ravineFinishV038||[]).length,cross:(s.__ancientCrossbeamsV038||[]).length,gates:(s.__gateFinishV038||[]).length};
        """)
        R['core']=core
        R['checks']['v036_v037_preserved']=bool(core.get('v36',{}).get('keyDoors') and core.get('v37',{}).get('ready'))
        R['checks']['v038_ready']=bool(core.get('v38',{}).get('ready') and core.get('life')=='active')
        R['checks']['ground_pixel_alignment']=float(core.get('maxErr',99))<=1.1 and core.get('groundCount',0)>100
        R['checks']['ravines_and_props_preserved']=core.get('ravines')==10 and core.get('props')==10
        R['checks']['density_enemies_preserved']=core.get('extra')==4
        R['checks']['forest_finish_dense']=core.get('forest',0)>=130
        R['checks']['ravine_finish_dense']=core.get('ravineFinish',0)>=80
        R['checks']['ancient_crossbeams_5']=core.get('cross')==5
        R['checks']['gate_finish_3']=core.get('gates')==3

        # Ground close-up: actual physics remains unchanged; evidence is only visual.
        tp(1350,254,False);d.execute_script("const s=window.__KELVOR_W01_L01_V038__;s.cameras.main.setZoom(1.55);s.cameras.main.centerOn(1350,254);");time.sleep(.3);shot('ground_close.png');d.execute_script("window.__KELVOR_W01_L01_V038__.cameras.main.setZoom(1);")
        for name,x in SAFE_SECTIONS:
            view(x,x);shot('section_'+name+'.png')

        # Reveal authored Ancient Crossing before its dedicated wide visual inspection.
        tp(27120,254,False);d.execute_script("window.__KELVOR_W01_L01_V038__.updateSetPiecesRC37();");time.sleep(1.1)
        for name,a0,b0 in PITS:
            center=(a0+b0)/2;playerx=a0-100;view(center,playerx);shot(name+'.png')

        # Camera lock survives on a real high platform with follow enabled.
        tp(12720,80,True);time.sleep(.55);shot('platform_high.png')
        cam=d.execute_script("const s=window.__KELVOR_W01_L01_V038__;return {scrollY:s.cameras.main.scrollY,offset:s.cameras.main.followOffset?.y??0};")
        R['camera']=cam;R['checks']['vertical_camera_lock']=abs(float(cam.get('scrollY',999)))<.5 and abs(float(cam.get('offset',999)))<.5

        # Door ceremony must remain semantic, interactive and solid-free only after key insertion.
        view(10480,10290);shot('gate_locked.png')
        d.execute_script("const s=window.__KELVOR_W01_L01_V038__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');g.defeated=g.required;s.updateArenaGatesRC37();")
        tp(10170,238,False);d.execute_script("window.__KELVOR_W01_L01_V038__.updateArenaGatesRC37();");time.sleep(.3);view(10280,10170);shot('gate_key.png')
        tp(10375,254,False);d.execute_script("const s=window.__KELVOR_W01_L01_V038__;s.router.virtual.attack=true;s.__prevAttackV036=false;s.updateArenaGatesRC37();s.router.virtual.attack=false;");time.sleep(.12);view(10420,10375);shot('gate_insert.png');time.sleep(1.0);view(10480,10375);shot('gate_open.png')
        door=d.execute_script("const s=window.__KELVOR_W01_L01_V038__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');return {open:g.open,consumed:g.keyConsumed,solid:!!g.solid?.body?.enable,arch:!!g.__archV037,finish:(s.__gateFinishV038||[]).length};")
        R['door']=door;R['checks']['door_key_logic_preserved']=bool(door.get('open') and door.get('consumed') and not door.get('solid') and door.get('arch') and door.get('finish')==3)
        snap=d.execute_script("return window.__KELVOR_W01_L01_V038__.rc37Snapshot();");R['checks']['snapshot_v038']=bool(isinstance(snap,dict) and snap.get('ownerV038',{}).get('ready'))
        vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2);R['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
