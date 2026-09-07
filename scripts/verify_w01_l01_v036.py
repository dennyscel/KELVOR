#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,threading,time,math
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

SECTION_CENTERS=[
 ('01_dawn',1800),('02_rootfall',5600),('03_hollow',9200),('04_canopy',12900),('05_sunken',16900),
 ('06_spirit',20700),('07_twin',24600),('08_ancient',28600),('09_guardian',32700),('10_finale',36500)
]
PIT_FOCUS=[('pit_rootfall',4175),('pit_canopy',11672),('pit_ancient',28070)]

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
    d=webdriver.Chrome(options=o);R={'checks':{},'screenshots':[],'status':'FAIL'}
    def shot(name):
        d.save_screenshot(str(out/name));R['screenshots'].append(name)
    def scene_ready():
        return d.execute_script("return !!window.__KELVOR_RC39_W01L01_V036_READY__&&!!window.__KELVOR_W01_L01_V036__&&window.__KELVOR_W01_L01_V036__.scene?.isActive?.()===true;")
    def tp(x,y=254):
        d.execute_script("""const s=window.__KELVOR_W01_L01_V036__,p=s.player;p.actor.setPosition(arguments[0],arguments[1]);p.body.reset(arguments[0],arguments[1]);s.cameras.main.centerOn(arguments[0],180);s.cameras.main.scrollY=0;""",x,y)
        time.sleep(.35)
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?rc37=1&debug=1&v=036qa');deadline=time.monotonic()+35
        while time.monotonic()<deadline:
            time.sleep(.2)
            if scene_ready():break
        else:raise SystemExit('v036/scene not ready')
        time.sleep(.8)
        core=d.execute_script("""
          const s=window.__KELVOR_W01_L01_V036__,kids=s.children?.list||[];
          const grounds=kids.filter(o=>o.__groundSurfaceV036);
          const groundErr=grounds.map(o=>{const m=o.__groundSurfaceV036,fr=o.frame,scale=o.scaleY||1;const visualTop=o.y-o.displayHeight+(m.topPx*scale);return {frame:m.frame,visualTop,surface:m.surfaceY,error:visualTop-m.surfaceY};});
          const props=(s.__solidLandmarksV036||[]).map(q=>({x:q.x,w:q.w,h:q.h,solidActive:!!q.solid?.active,bodyEnabled:!!q.solid?.body?.enable}));
          const density=(s.enemies||[]).filter(e=>e.__densityV036).map(e=>({x:e.x||e.actor?.x,alive:e.alive!==false,anim:e.anim}));
          const gates=(s.lockGatesRC37||[]).map(g=>({id:g.id,x:g.x,open:g.open,required:g.required,defeated:g.defeated,keyName:g.keyName,keySpawned:g.keySpawned,keyCollected:g.keyCollected,visualTex:g.visual?.texture?.key||null,alpha:g.visual?.alpha??null}));
          return {flag:!!s.__v036?.ready,v:s.__v036,groundCount:grounds.length,groundErr,ravines:(s.__ravinesV036||[]).length,props,density,gates,life:s.lifeCycle};
        """)
        R['core']=core
        R['checks']['scene_active']=core.get('life')=='active' and bool(core.get('flag'))
        R['checks']['ground_tiles_present']=core.get('groundCount',0)>100
        maxerr=max([abs(float(x.get('error',999))) for x in core.get('groundErr',[])],default=999)
        R['ground_max_surface_error_px']=round(maxerr,3)
        R['checks']['ground_surface_alignment']=maxerr<=1.1
        R['checks']['ravines_10']=core.get('ravines')==10
        R['checks']['solid_landmarks_10']=len(core.get('props',[]))==10 and all(p.get('solidActive') and p.get('bodyEnabled') for p in core.get('props',[]))
        R['checks']['extra_enemies_4']=len(core.get('density',[]))==4
        R['checks']['three_key_gates_initialized']=len(core.get('gates',[]))==3 and all(g.get('keyName') and not g.get('open') for g in core.get('gates',[]))

        # Ground contact visual evidence at three representative ground modules.
        for name,x in [('ground_start',1050),('ground_mid',15600),('ground_late',35200)]:
            tp(x,254);shot(name+'.png')

        # Ravine visual evidence.
        for name,x in PIT_FOCUS:
            tp(x-120,254);shot(name+'.png')

        # Gate A logical sequence: requirements -> key appears -> pickup -> insert -> open.
        tp(10300,254);shot('gate_a_locked.png')
        gate_spawn=d.execute_script("""
          const s=window.__KELVOR_W01_L01_V036__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');
          g.defeated=g.required;s.updateArenaGatesRC37();
          return {open:g.open,keySpawned:g.keySpawned,keyCollected:g.keyCollected,keyActive:!!g.keySprite?.active,keyX:g.keySpawnX,keyY:g.keySprite?.y||null,label:g.__ownerLabelV031?.text||''};
        """)
        R['gate_spawn']=gate_spawn
        R['checks']['gate_does_not_auto_open']=bool(gate_spawn.get('keySpawned') and not gate_spawn.get('open') and gate_spawn.get('keyActive'))
        tp(10170,238);d.execute_script("window.__KELVOR_W01_L01_V036__.updateArenaGatesRC37();");time.sleep(.35);shot('gate_a_key_pickup.png')
        gate_pick=d.execute_script("""
          const s=window.__KELVOR_W01_L01_V036__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');return {open:g.open,collected:g.keyCollected,held:s.__gateFlowV036?.held,hud:!!s.__keyHudV036?.box?.visible};
        """)
        R['gate_pickup']=gate_pick
        R['checks']['key_pickup_before_open']=bool(gate_pick.get('collected') and gate_pick.get('held')=='GATE_A' and gate_pick.get('hud') and not gate_pick.get('open'))
        tp(10375,254);d.execute_script("""const s=window.__KELVOR_W01_L01_V036__;s.router.virtual.attack=true;s.__prevAttackV036=false;s.updateArenaGatesRC37();s.router.virtual.attack=false;""");time.sleep(.12);shot('gate_a_insert.png');time.sleep(1.05);shot('gate_a_open.png')
        gate_open=d.execute_script("""
          const s=window.__KELVOR_W01_L01_V036__,g=s.lockGatesRC37.find(x=>x.id==='GATE_A');return {open:g.open,opening:g.opening,keyConsumed:g.keyConsumed,held:s.__gateFlowV036?.held,solidActive:!!g.solid?.active,bodyEnabled:!!g.solid?.body?.enable,tex:g.visual?.texture?.key||null,crop:{x:g.visual?._crop?.x||null,w:g.visual?._crop?.width||null},alpha:g.visual?.alpha??null,visible:g.visual?.visible??null};
        """)
        R['gate_open']=gate_open
        R['checks']['key_ceremony_opens_gate']=bool(gate_open.get('open') and gate_open.get('keyConsumed') and gate_open.get('held') is None and not gate_open.get('solidActive') and not gate_open.get('bodyEnabled') and gate_open.get('visible') and float(gate_open.get('alpha') or 0)>=.95)

        # Full-section visual scan from authored section centers.
        for name,x in SECTION_CENTERS:
            tp(x,254);shot('section_'+name+'.png')

        # High platform/camera evidence to ensure prior parallax fix survives rebuild.
        tp(12720,80);shot('platform_high.png')
        camera=d.execute_script("const s=window.__KELVOR_W01_L01_V036__;return {scrollY:s.cameras.main.scrollY,followOffsetY:s.cameras.main.followOffset?.y??0};")
        R['camera']=camera;R['checks']['background_vertical_lock_preserved']=abs(float(camera.get('scrollY',999)))<.5

        # Snapshot smoke ensures diagnostic serialization still works.
        snap=d.execute_script("return window.__KELVOR_W01_L01_V036__.rc37Snapshot();")
        R['snapshot_owner_v036']=snap.get('ownerV036') if isinstance(snap,dict) else None
        R['checks']['snapshot_v036_present']=bool(R['snapshot_owner_v036'] and R['snapshot_owner_v036'].get('keyDoors'))

        vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2);R['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
