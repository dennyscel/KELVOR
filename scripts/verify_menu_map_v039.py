#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

PORTRAIT=(430,932)
LANDSCAPE=(932,430)
DESKTOP=(1536,691)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--web',required=True);ap.add_argument('--chrome',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    web=Path(a.web).resolve();out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*x,**kw):super().__init__(*x,directory=str(web),**kw)
        def log_message(self,*x):pass
    srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start();port=srv.server_address[1]
    o=Options();o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required',f'--window-size={PORTRAIT[0]},{PORTRAIT[1]}']:o.add_argument(f)
    d=webdriver.Chrome(options=o);R={'checks':{},'captures':[],'status':'FAIL'}
    def shot(name):d.save_screenshot(str(out/name));R['captures'].append(name)
    def setsize(sz):d.set_window_rect(width=sz[0],height=sz[1]);time.sleep(.25)
    def wait_menu(ori,timeout=10):
        end=time.monotonic()+timeout
        while time.monotonic()<end:
            time.sleep(.15)
            ok=d.execute_script("return !!window.__KELVOR_MAIN_MENU_V039__ && window.__KELVOR_MAIN_MENU_V039__.scene?.isActive?.()===true && window.__KELVOR_MAIN_MENU_V039__.__v039?.orientation===arguments[0];",ori)
            if ok:return True
        return False
    def wait_map(ori,timeout=10):
        end=time.monotonic()+timeout
        while time.monotonic()<end:
            time.sleep(.15)
            ok=d.execute_script("return !!window.__KELVOR_WORLD_MAP_V039__ && window.__KELVOR_WORLD_MAP_V039__.scene?.isActive?.()===true && window.__KELVOR_WORLD_MAP_V039__.__v039?.orientation===arguments[0] && !!window.__KELVOR_WORLD_MAP_V039__.__mapLayoutV039?.map?.active;",ori)
            if ok:return True
        return False
    def menu_metrics():
        return d.execute_script("""
          const s=window.__KELVOR_MAIN_MENU_V039__,w=s.scale.width,h=s.scale.height,L=s.__layoutV039;
          const B=b=>({x:b.box.x,y:b.box.y,w:b.box.displayWidth||b.box.width,h:b.box.displayHeight||b.box.height,visible:b.box.visible,label:b.label.text,inside:b.box.x-(b.box.displayWidth||b.box.width)/2>=0&&b.box.x+(b.box.displayWidth||b.box.width)/2<=w&&b.box.y-(b.box.displayHeight||b.box.height)/2>=0&&b.box.y+(b.box.displayHeight||b.box.height)/2<=h});
          const bs=[L.start,L.music,L.options,L.credits,L.fs].map(B);
          const texts=(s.children.list||[]).filter(o=>o.type==='Text').map(o=>o.text);
          return {w,h,ori:s.__v039.orientation,buttons:bs,hero:{x:L.hero.x,y:L.hero.y,visible:L.hero.visible},title:{x:L.title.x,y:L.title.y,visible:L.title.visible},badge:{x:L.badge.x,y:L.badge.y,visible:L.badge.visible},texts};
        """)
    def map_metrics():
        return d.execute_script("""
          const s=window.__KELVOR_WORLD_MAP_V039__,w=s.scale.width,h=s.scale.height,c=s.__mapChromeV039,L=s.__mapLayoutV039;
          const B=b=>({x:b.box.x,y:b.box.y,w:b.box.displayWidth||b.box.width,h:b.box.displayHeight||b.box.height,visible:b.box.visible,label:b.label.text,inside:(!b.box.visible)|| (b.box.x-(b.box.displayWidth||b.box.width)/2>=0&&b.box.x+(b.box.displayWidth||b.box.width)/2<=w&&b.box.y-(b.box.displayHeight||b.box.height)/2>=0&&b.box.y+(b.box.displayHeight||b.box.height)/2<=h)});
          const bs=[c.prev,c.play,c.next,c.worldPrev,c.worldNext,c.fs].map(B);
          const texts=(s.children.list||[]).filter(o=>o.type==='Text'&&o.visible).map(o=>String(o.text||''));
          return {w,h,ori:s.__v039.orientation,map:{x:L.map.x,y:L.map.y,w:L.map.displayWidth,h:L.map.displayHeight,alpha:L.map.alpha,visible:L.map.visible},buttons:bs,nodeTitle:c.nodeTitle.text,nodeState:c.nodeState.text,texts,selected:s.selected};
        """)
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?v=039qa')
        if not wait_menu('portrait',20):raise SystemExit('portrait menu not ready')
        time.sleep(.5);shot('menu_portrait_1.png');m1=menu_metrics();R['menu_portrait_1']=m1
        R['checks']['menu_portrait_buttons_inside']=all(x['inside'] and x['visible'] for x in m1['buttons'])
        R['checks']['menu_portrait_touch_targets']=all(x['h']>=34 for x in m1['buttons']) and m1['buttons'][0]['h']>=44
        R['checks']['menu_portrait_balanced']=m1['hero']['y']<m1['h']*.60 and m1['buttons'][0]['y']>m1['h']*.58 and m1['buttons'][0]['y']<m1['h']*.76

        setsize(LANDSCAPE)
        if not wait_menu('landscape'):raise SystemExit('landscape menu not ready after rotation')
        time.sleep(.4);shot('menu_landscape_1.png');m2=menu_metrics();R['menu_landscape_1']=m2
        R['checks']['menu_landscape_buttons_inside']=all(x['inside'] and x['visible'] for x in m2['buttons'])
        R['checks']['menu_landscape_balanced']=m2['hero']['x']>m2['w']*.58 and m2['buttons'][0]['x']<m2['w']*.48

        setsize(PORTRAIT)
        if not wait_menu('portrait'):raise SystemExit('portrait menu not ready after second rotation')
        time.sleep(.4);shot('menu_portrait_2.png');m3=menu_metrics();R['menu_portrait_2']=m3
        R['checks']['menu_repeat_stable']=abs(m1['buttons'][0]['y']-m3['buttons'][0]['y'])<=3 and abs(m1['hero']['y']-m3['hero']['y'])<=3

        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('OptionsSceneV10')");time.sleep(.7)
        back=d.execute_script("return !!window.__KELVOR_OPTIONS_V001__?.__backV034?.box?.visible;")
        R['checks']['options_touch_back_preserved']=bool(back)
        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('WorldMapSceneRC1')")
        if not wait_map('portrait'):raise SystemExit('portrait map not ready')
        time.sleep(.6);shot('map_portrait_1.png');p1=map_metrics();R['map_portrait_1']=p1
        R['checks']['map_portrait_island_large']=p1['map']['visible'] and p1['map']['alpha']>.9 and p1['map']['w']>=p1['w']*.70
        R['checks']['map_portrait_controls_inside']=all(x['inside'] for x in p1['buttons'])
        R['checks']['map_portrait_play_touch']=next(x for x in p1['buttons'] if x['label']=='JOGAR FASE')['h']>=44
        R['checks']['map_no_rotate_overlay']=not any('GIRE O CELULAR' in t.upper() for t in p1['texts'])
        R['checks']['map_text_present']=bool(p1['nodeTitle'] and p1['nodeState'])

        setsize(LANDSCAPE)
        if not wait_map('landscape'):raise SystemExit('landscape map not ready after rotation')
        time.sleep(.5);shot('map_landscape_1.png');l1=map_metrics();R['map_landscape_1']=l1
        R['checks']['map_landscape_island_large']=l1['map']['visible'] and l1['map']['alpha']>.9 and l1['map']['w']>=min(320,l1['w']*.34)
        R['checks']['map_landscape_controls_inside']=all(x['inside'] for x in l1['buttons'])

        setsize(PORTRAIT)
        if not wait_map('portrait'):raise SystemExit('portrait map not ready second time')
        time.sleep(.5);shot('map_portrait_2.png');p2=map_metrics();R['map_portrait_2']=p2
        R['checks']['map_repeat_stable']=abs(p1['map']['w']-p2['map']['w'])<=4 and abs(p1['map']['y']-p2['map']['y'])<=4 and p1['selected']==p2['selected']

        setsize(LANDSCAPE)
        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('MainMenuSceneV10')")
        if not wait_menu('landscape'):raise SystemExit('menu reentry landscape failed')
        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('WorldMapSceneRC1')")
        if not wait_map('landscape'):raise SystemExit('map reentry landscape failed')
        time.sleep(.5);shot('map_landscape_reentry.png');lr=map_metrics();R['map_landscape_reentry']=lr
        R['checks']['map_reentry_not_blank']=lr['map']['visible'] and lr['map']['alpha']>.9 and lr['map']['w']>=min(320,lr['w']*.34)

        setsize(PORTRAIT);d.get(f'http://127.0.0.1:{port}/index.html?v=039qa_reload')
        if not wait_menu('portrait',20):raise SystemExit('menu reload portrait failed')
        time.sleep(.4);shot('menu_portrait_reload.png')
        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('WorldMapSceneRC1')")
        if not wait_map('portrait'):raise SystemExit('map reload portrait failed')
        time.sleep(.5);shot('map_portrait_reload.png');pr=map_metrics();R['map_portrait_reload']=pr
        R['checks']['reload_map_not_blank']=pr['map']['visible'] and pr['map']['alpha']>.9 and pr['map']['w']>=pr['w']*.70

        setsize(DESKTOP);d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('MainMenuSceneV10')")
        if not wait_menu('landscape'):raise SystemExit('desktop menu failed')
        time.sleep(.4);shot('menu_desktop.png');md=menu_metrics();R['menu_desktop']=md
        R['checks']['desktop_menu_inside']=all(x['inside'] for x in md['buttons'])

        vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2);R['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
