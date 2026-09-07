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
    srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start();port=srv.server_address[1]
    o=Options();o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=1536,691']:o.add_argument(f)
    d=webdriver.Chrome(options=o);R={'checks':{},'screenshots':[],'status':'FAIL'}
    def shot(name):d.save_screenshot(str(out/name));R['screenshots'].append(name)
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?v=035qa');deadline=time.monotonic()+30
        while time.monotonic()<deadline:
            time.sleep(.2)
            if d.execute_script("return !!window.__KELVOR_RC39_MENU_MAP_V035_READY__&&!!window.__KELVOR_MAIN_MENU_V034__;"):break
        else:raise SystemExit('v035/menu not ready')
        time.sleep(.7);shot('menu_landscape.png')
        menu=d.execute_script("""
          const s=window.__KELVOR_MAIN_MENU_V034__,w=s.scale.width,h=s.scale.height;
          const inside=b=>b&&b.box.visible&&b.box.x-b.box.width/2>=0&&b.box.x+b.box.width/2<=w&&b.box.y-b.box.height/2>=0&&b.box.y+b.box.height/2<=h;
          const bigGlow=(s.children.list||[]).filter(o=>(o.type==='Ellipse'||o.type==='Arc')&&o.depth===-88).map(o=>({w:o.displayWidth,h:o.displayHeight,a:o.alpha}));
          return {w,h,allButtons:(s.ui||[]).every(inside),labels:(s.ui||[]).map(b=>b.label.text),bigGlow,flag:!!s.__v035?.menuArtifactCleanup};
        """)
        R['menu']=menu;R['checks']['menu_ready']=bool(menu['flag']);R['checks']['menu_controls_inside']=bool(menu['allButtons']);R['checks']['menu_has_fullscreen']=any('TELA CHEIA' in x for x in menu['labels']);R['checks']['menu_glow_subtle']=all(g['w']<=160 and g['h']<=72 and g['a']<=.04 for g in menu['bigGlow'])

        d.execute_script("window.__KELVOR_MAIN_MENU_V034__.scene.start('OptionsSceneV10')");deadline=time.monotonic()+8
        while time.monotonic()<deadline:
            time.sleep(.15)
            if d.execute_script("return !!window.__KELVOR_OPTIONS_V001__?.__backV034;"):break
        time.sleep(.3);shot('options_landscape.png')
        opt=d.execute_script("const s=window.__KELVOR_OPTIONS_V001__,b=s.__backV034;return {visible:!!b?.box?.visible,label:b?.label?.text||'',active:s.scene.isActive()};")
        R['options']=opt;R['checks']['options_back_visible']=bool(opt['visible'] and 'VOLTAR' in opt['label'] and opt['active'])
        d.execute_script("window.__KELVOR_OPTIONS_V001__.__backV034.press()");time.sleep(.6)
        R['checks']['options_back_returns_menu']=bool(d.execute_script("return window.__KELVOR_MAIN_MENU_V034__?.scene?.isActive?.()===true;"))

        d.execute_script("window.__KELVOR_MAIN_MENU_V034__.scene.start('WorldMapSceneRC1')");deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            time.sleep(.15)
            if d.execute_script("return !!window.__KELVOR_CAMPAIGN_MAP_SCENE__?.__v035?.visualCleanup;"):break
        time.sleep(.7);shot('map_landscape.png')
        mp=d.execute_script("""
          const s=window.__KELVOR_CAMPAIGN_MAP_SCENE__,c=s.__mapChromeV034,w=s.scale.width,h=s.scale.height,f=s.fullscreenControllerCampaignRC1;
          const inside=b=>b&&b.box.visible&&b.box.x-b.box.width/2>=0&&b.box.x+b.box.width/2<=w&&b.box.y-b.box.height/2>=0&&b.box.y+b.box.height/2<=h;
          return {active:s.scene.isActive(),newFs:inside(c.fs),play:inside(c.play),prev:inside(c.prev),next:inside(c.next),legacyButton:!!f?.button?.visible,legacyLabel:!!f?.label?.visible,node:c.nodeTitle?.text||'',state:c.nodeState?.text||'',cleanup:!!s.__v035?.visualCleanup};
        """)
        R['map']=mp;R['checks']['map_active']=bool(mp['active']);R['checks']['map_controls_inside']=all(mp[k] for k in ['newFs','play','prev','next']);R['checks']['map_legacy_fullscreen_hidden']=not mp['legacyButton'] and not mp['legacyLabel'];R['checks']['map_node_readable']=bool(mp['node'] and mp['state'] and mp['cleanup'])

        d.set_window_rect(width=915,height=412);time.sleep(.8);shot('map_small_landscape.png')
        small=d.execute_script("""
          const s=window.__KELVOR_CAMPAIGN_MAP_SCENE__,c=s.__mapChromeV034,w=s.scale.width,h=s.scale.height;
          const inside=b=>b&&b.box.visible&&b.box.x-b.box.width/2>=0&&b.box.x+b.box.width/2<=w&&b.box.y-b.box.height/2>=0&&b.box.y+b.box.height/2<=h;
          return {prev:inside(c.prev),play:inside(c.play),next:inside(c.next),fs:inside(c.fs),card:c.nodeCard.x-c.nodeCard.displayWidth/2>=0&&c.nodeCard.x+c.nodeCard.displayWidth/2<=w};
        """)
        R['responsive']=small;R['checks']['map_small_inside']=all(small.values())
        d.execute_script("window.__KELVOR_CAMPAIGN_MAP_SCENE__.scene.start('MainMenuSceneV10')");time.sleep(.8);shot('menu_small_landscape.png')
        sm=d.execute_script("const s=window.__KELVOR_MAIN_MENU_V034__,w=s.scale.width,h=s.scale.height;const inside=b=>b&&b.box.visible&&b.box.x-b.box.width/2>=0&&b.box.x+b.box.width/2<=w&&b.box.y-b.box.height/2>=0&&b.box.y+b.box.height/2<=h;return {active:s.scene.isActive(),inside:(s.ui||[]).every(inside)};")
        R['menu_small']=sm;R['checks']['menu_small_inside']=bool(sm['active'] and sm['inside'])
        vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/len(vals),2);R['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
