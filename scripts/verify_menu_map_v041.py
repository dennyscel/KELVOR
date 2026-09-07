#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,threading,time
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

PORTRAIT=(430,932); LANDSCAPE=(932,430); DESKTOP=(1536,691)
UI_KEYS={'MainMenuSceneV10','WorldMapSceneRC1','OptionsSceneV10','MusicPlayerSceneV10','CreditsSceneV10'}

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
    def shot(n):d.save_screenshot(str(out/n));R['captures'].append(n)
    def setsize(sz):d.set_window_rect(width=sz[0],height=sz[1]);time.sleep(.32)
    def active_ui():
        return d.execute_script("""const g=window.__KELVOR_GAME_RC3__;if(!g)return [];return g.scene.getScenes(true).map(s=>s.scene.key).filter(k=>['MainMenuSceneV10','WorldMapSceneRC1','OptionsSceneV10','MusicPlayerSceneV10','CreditsSceneV10'].includes(k));""")
    def exclusive(key):
        a=active_ui();return len(a)==1 and a[0]==key
    def wait_expr(js,args=(),timeout=12):
        end=time.monotonic()+timeout
        while time.monotonic()<end:
            time.sleep(.16)
            try:
                if d.execute_script(js,*args):return True
            except Exception:pass
        return False
    def wait_menu(ori):return wait_expr("return !!window.__KELVOR_MAIN_MENU_V039__&&window.__KELVOR_MAIN_MENU_V039__.scene?.isActive?.()===true&&window.__KELVOR_MAIN_MENU_V039__.__v039?.orientation===arguments[0];",(ori,))
    def wait_map(ori):return wait_expr("return !!window.__KELVOR_WORLD_MAP_V039__&&window.__KELVOR_WORLD_MAP_V039__.scene?.isActive?.()===true&&window.__KELVOR_WORLD_MAP_V039__.__v039?.orientation===arguments[0]&&!!window.__KELVOR_WORLD_MAP_V039__.__mapLayoutV039?.map?.active;",(ori,))
    def menu_metrics():return d.execute_script("""
      const s=window.__KELVOR_MAIN_MENU_V039__,w=s.scale.width,h=s.scale.height,L=s.__layoutV039;
      const B=b=>({x:b.box.x,y:b.box.y,w:b.box.displayWidth||b.box.width,h:b.box.displayHeight||b.box.height,label:b.label.text,visible:b.box.visible,inside:b.box.x-(b.box.displayWidth||b.box.width)/2>=0&&b.box.x+(b.box.displayWidth||b.box.width)/2<=w&&b.box.y-(b.box.displayHeight||b.box.height)/2>=0&&b.box.y+(b.box.displayHeight||b.box.height)/2<=h});
      return {w,h,ori:s.__v039.orientation,v40:s.__v040||null,v41:s.__v041||null,buttons:[L.start,L.music,L.options,L.credits,L.fs].map(B),hero:{x:L.hero.x,y:L.hero.y,scale:L.hero.scaleX},title:{x:L.title.x,y:L.title.y},badge:{x:L.badge.x,y:L.badge.y},premium:!!s.__portraitPremiumV041};
    """)
    def map_metrics():return d.execute_script("""
      const s=window.__KELVOR_WORLD_MAP_V039__,w=s.scale.width,h=s.scale.height,c=s.__mapChromeV039,L=s.__mapLayoutV039;
      const B=b=>({x:b.box.x,y:b.box.y,w:b.box.displayWidth||b.box.width,h:b.box.displayHeight||b.box.height,label:b.label.text,visible:b.box.visible,inside:(!b.box.visible)||(b.box.x-(b.box.displayWidth||b.box.width)/2>=0&&b.box.x+(b.box.displayWidth||b.box.width)/2<=w&&b.box.y-(b.box.displayHeight||b.box.height)/2>=0&&b.box.y+(b.box.displayHeight||b.box.height)/2<=h)});
      const texts=(s.children.list||[]).filter(o=>o.type==='Text'&&o.visible).map(o=>String(o.text||''));
      return {w,h,ori:s.__v039.orientation,v40:s.__v040||null,v41:s.__v041||null,map:{x:L.map.x,y:L.map.y,w:L.map.displayWidth,h:L.map.displayHeight,alpha:L.map.alpha,visible:L.map.visible},buttons:[c.prev,c.play,c.next,c.worldPrev,c.worldNext,c.fs].map(B),nodeTitle:c.nodeTitle.text,nodeState:c.nodeState.text,texts,selected:s.selected};
    """)
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?v=041qa')
        if not wait_menu('portrait'):raise SystemExit('initial portrait menu not ready')
        time.sleep(.45);shot('menu_portrait_1.png');mp1=menu_metrics();R['menu_portrait_1']=mp1
        R['checks']['portrait_menu_exclusive']=exclusive('MainMenuSceneV10')
        R['checks']['portrait_menu_v041']=bool(mp1.get('premium') and mp1.get('v41',{}).get('portraitPremium'))
        R['checks']['portrait_menu_controls']=all(x['inside'] and x['visible'] for x in mp1['buttons']) and mp1['buttons'][0]['h']>=44
        R['checks']['portrait_menu_compact']=mp1['hero']['y']<mp1['h']*.47 and mp1['buttons'][0]['y']<mp1['h']*.64 and mp1['buttons'][-2]['y']<mp1['h']*.78

        setsize(LANDSCAPE)
        if not wait_menu('landscape'):raise SystemExit('landscape menu not ready')
        time.sleep(.4);shot('menu_landscape_1.png');ml1=menu_metrics();R['menu_landscape_1']=ml1
        R['checks']['landscape_menu_exclusive']=exclusive('MainMenuSceneV10')
        R['checks']['landscape_menu_controls']=all(x['inside'] and x['visible'] for x in ml1['buttons'])

        setsize(PORTRAIT)
        if not wait_menu('portrait'):raise SystemExit('second portrait menu not ready')
        time.sleep(.4);shot('menu_portrait_2.png');mp2=menu_metrics();R['menu_portrait_2']=mp2
        R['checks']['portrait_menu_repeat']=abs(mp1['hero']['y']-mp2['hero']['y'])<=3 and abs(mp1['buttons'][0]['y']-mp2['buttons'][0]['y'])<=3

        d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('OptionsSceneV10')")
        if not wait_expr("return !!window.__KELVOR_OPTIONS_V001__?.__backV034?.box?.visible&&window.__KELVOR_OPTIONS_V001__.scene?.isActive?.()===true;"):raise SystemExit('options not ready')
        time.sleep(.3);shot('options_portrait.png');R['checks']['options_exclusive']=exclusive('OptionsSceneV10')
        d.execute_script("window.__KELVOR_OPTIONS_V001__.__backV034.press()")
        if not wait_menu('portrait'):raise SystemExit('menu did not return from options')
        R['checks']['options_back_returns_menu']=exclusive('MainMenuSceneV10')

        d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('WorldMapSceneRC1')")
        if not wait_map('portrait'):raise SystemExit('portrait map not ready')
        time.sleep(.5);shot('map_portrait_1.png');p1=map_metrics();R['map_portrait_1']=p1
        R['checks']['portrait_map_exclusive']=exclusive('WorldMapSceneRC1')
        R['checks']['portrait_map_large']=p1['map']['visible'] and p1['map']['alpha']>.9 and p1['map']['w']>=p1['w']*.78
        R['checks']['portrait_map_controls']=all(x['inside'] for x in p1['buttons']) and next(x for x in p1['buttons'] if x['label']=='JOGAR FASE')['h']>=44
        R['checks']['portrait_map_no_rotate_overlay']=not any('GIRE O CELULAR' in t.upper() for t in p1['texts'])

        setsize(LANDSCAPE)
        if not wait_map('landscape'):raise SystemExit('landscape map not ready')
        time.sleep(.45);shot('map_landscape_1.png');l1=map_metrics();R['map_landscape_1']=l1
        R['checks']['landscape_map_exclusive']=exclusive('WorldMapSceneRC1')
        R['checks']['landscape_map_large']=l1['map']['visible'] and l1['map']['alpha']>.9 and l1['map']['w']>=315
        R['checks']['landscape_map_controls']=all(x['inside'] for x in l1['buttons'])

        setsize(PORTRAIT)
        if not wait_map('portrait'):raise SystemExit('second portrait map not ready')
        time.sleep(.45);shot('map_portrait_2.png');p2=map_metrics();R['map_portrait_2']=p2
        R['checks']['portrait_map_repeat']=abs(p1['map']['w']-p2['map']['w'])<=4 and abs(p1['map']['y']-p2['map']['y'])<=4 and p1['selected']==p2['selected']

        # Real scene-plugin reentry: map -> menu -> map.
        d.execute_script("window.__KELVOR_WORLD_MAP_V039__.scene.start('MainMenuSceneV10')")
        if not wait_menu('portrait'):raise SystemExit('portrait menu reentry failed')
        R['checks']['menu_reentry_exclusive']=exclusive('MainMenuSceneV10')
        d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('WorldMapSceneRC1')")
        if not wait_map('portrait'):raise SystemExit('portrait map reentry failed')
        time.sleep(.4);shot('map_portrait_reentry.png');pr=map_metrics();R['checks']['map_reentry_exclusive']=exclusive('WorldMapSceneRC1') and pr['map']['w']>=pr['w']*.78

        # Reload in portrait, then enter map normally from the menu scene.
        d.get(f'http://127.0.0.1:{port}/index.html?v=041qa_reload')
        if not wait_menu('portrait'):raise SystemExit('portrait menu reload failed')
        time.sleep(.35);shot('menu_portrait_reload.png');R['checks']['reload_menu_exclusive']=exclusive('MainMenuSceneV10')
        d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('WorldMapSceneRC1')")
        if not wait_map('portrait'):raise SystemExit('portrait map reload failed')
        time.sleep(.4);shot('map_portrait_reload.png');rr=map_metrics();R['checks']['reload_map_exclusive']=exclusive('WorldMapSceneRC1') and rr['map']['w']>=rr['w']*.78

        # Desktop: leave map through scene plugin, then resize active menu.
        d.execute_script("window.__KELVOR_WORLD_MAP_V039__.scene.start('MainMenuSceneV10')")
        if not wait_menu('portrait'):raise SystemExit('menu before desktop failed')
        setsize(DESKTOP)
        if not wait_menu('landscape'):raise SystemExit('desktop menu resize failed')
        time.sleep(.45);shot('menu_desktop.png');md=menu_metrics();R['menu_desktop']=md
        R['checks']['desktop_menu_exclusive']=exclusive('MainMenuSceneV10')
        R['checks']['desktop_menu_controls']=all(x['inside'] for x in md['buttons'])

        vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2);R['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
