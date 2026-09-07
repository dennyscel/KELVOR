#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,threading,time
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

PORTRAIT=(430,932);LANDSCAPE=(932,430);DESKTOP=(1536,691)
KEYS=['MainMenuSceneV10','WorldMapSceneRC1','OptionsSceneV10','MusicPlayerSceneV10','CreditsSceneV10']

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
  def setsize(sz):d.set_window_rect(width=sz[0],height=sz[1]);time.sleep(.35)
  def active():return d.execute_script("return window.__KELVOR_GAME_RC3__?.scene?.getScenes(true)?.map(s=>s.scene.key).filter(k=>arguments[0].includes(k))||[];",KEYS)
  def exclusive(k):
    x=active();return len(x)==1 and x[0]==k
  def wait(js,args=(),timeout=12):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
      time.sleep(.16)
      try:
        if d.execute_script(js,*args):return True
      except Exception:pass
    return False
  def wm(ori):return wait("return !!window.__KELVOR_WORLD_MAP_V039__&&window.__KELVOR_WORLD_MAP_V039__.scene?.isActive?.()===true&&window.__KELVOR_WORLD_MAP_V039__.__v039?.orientation===arguments[0]&&!!window.__KELVOR_WORLD_MAP_V039__.__mapLayoutV039?.map?.active;",(ori,))
  def mm(ori):return wait("return !!window.__KELVOR_MAIN_MENU_V039__&&window.__KELVOR_MAIN_MENU_V039__.scene?.isActive?.()===true&&window.__KELVOR_MAIN_MENU_V039__.__v039?.orientation===arguments[0];",(ori,))
  def menu_metrics():return d.execute_script("""
    const s=window.__KELVOR_MAIN_MENU_V039__,L=s.__layoutV039,w=s.scale.width,h=s.scale.height;const B=b=>({x:b.box.x,y:b.box.y,w:b.box.displayWidth||b.box.width,h:b.box.displayHeight||b.box.height,inside:b.box.x-(b.box.displayWidth||b.box.width)/2>=0&&b.box.x+(b.box.displayWidth||b.box.width)/2<=w&&b.box.y-(b.box.displayHeight||b.box.height)/2>=0&&b.box.y+(b.box.displayHeight||b.box.height)/2<=h});return {w,h,ori:s.__v039.orientation,hero:{x:L.hero.x,y:L.hero.y,scale:L.hero.scaleX},buttons:[L.start,L.music,L.options,L.credits,L.fs].map(B),v42:s.__v042||null,story:!!s.__storyWorldV042};
  """)
  def map_metrics():return d.execute_script("""
    const s=window.__KELVOR_WORLD_MAP_V039__,L=s.__mapLayoutV039,c=s.__mapChromeV039,w=s.scale.width,h=s.scale.height,m=L.map;const B=b=>({label:b.label.text,visible:b.box.visible,x:b.box.x,y:b.box.y,w:b.box.displayWidth||b.box.width,h:b.box.displayHeight||b.box.height,inside:(!b.box.visible)||(b.box.x-(b.box.displayWidth||b.box.width)/2>=0&&b.box.x+(b.box.displayWidth||b.box.width)/2<=w&&b.box.y-(b.box.displayHeight||b.box.height)/2>=0&&b.box.y+(b.box.displayHeight||b.box.height)/2<=h)});const nodes=Object.entries(s.nodes||{}).map(([n,o])=>({n,x:o.x,y:o.y,inside:o.x>=m.x-m.displayWidth*.47&&o.x<=m.x+m.displayWidth*.47&&o.y>=m.y-m.displayHeight*.47&&o.y<=m.y+m.displayHeight*.47}));const texts=(s.children.list||[]).filter(o=>o.type==='Text'&&o.visible).map(o=>String(o.text||''));return {w,h,ori:s.__v039.orientation,map:{x:m.x,y:m.y,w:m.displayWidth,h:m.displayHeight,visible:m.visible,alpha:m.alpha},buttons:[c.prev,c.play,c.next,c.worldPrev,c.worldNext,c.fs].map(B),nodes,route:!!s.__routeV042,v42:s.__v042||null,texts};
  """)
  try:
    d.get(f'http://127.0.0.1:{port}/index.html?v=042qa')
    if not mm('portrait'):raise SystemExit('portrait menu not ready')
    time.sleep(.45);shot('menu_portrait_1.png');m1=menu_metrics();R['menu_portrait_1']=m1
    R['checks']['menu_portrait_exclusive']=exclusive('MainMenuSceneV10');R['checks']['menu_portrait_v042']=bool(m1.get('story') and m1.get('v42',{}).get('portraitStory'));R['checks']['menu_portrait_controls']=all(x['inside'] for x in m1['buttons']);R['checks']['menu_portrait_compact']=m1['hero']['y']<m1['h']*.47 and m1['buttons'][0]['y']<m1['h']*.60
    setsize(LANDSCAPE)
    if not mm('landscape'):raise SystemExit('landscape menu not ready')
    time.sleep(.4);shot('menu_landscape.png');ml=menu_metrics();R['checks']['menu_landscape_exclusive']=exclusive('MainMenuSceneV10') and all(x['inside'] for x in ml['buttons'])
    setsize(PORTRAIT)
    if not mm('portrait'):raise SystemExit('portrait menu repeat failed')
    time.sleep(.35);shot('menu_portrait_2.png');m2=menu_metrics();R['checks']['menu_portrait_repeat']=abs(m1['hero']['y']-m2['hero']['y'])<=3 and abs(m1['buttons'][0]['y']-m2['buttons'][0]['y'])<=3

    d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('OptionsSceneV10')")
    if not wait("return !!window.__KELVOR_OPTIONS_V042__&&window.__KELVOR_OPTIONS_V042__.scene?.isActive?.()===true;"):raise SystemExit('options v042 not ready')
    time.sleep(.4);shot('options_portrait.png')
    opt=d.execute_script("""const s=window.__KELVOR_OPTIONS_V042__,ys=(s.rowObjects||[]).filter(o=>Number.isFinite(o.y)).map(o=>o.y);return {exclusive:s.scene.isActive(),v42:s.__v042||null,back:!!s.__backV034?.box?.visible,min:Math.min(...ys),max:Math.max(...ys),span:Math.max(...ys)-Math.min(...ys),h:s.scale.height,noteY:s.note?.y||0};""");R['options']=opt
    R['checks']['options_portrait_exclusive']=exclusive('OptionsSceneV10');R['checks']['options_portrait_reflow']=bool(opt.get('v42',{}).get('portraitReflow') and opt.get('back') and opt.get('span',0)>=opt.get('h',1)*.32 and opt.get('noteY',0)>=opt.get('h',1)*.58)
    d.execute_script("window.__KELVOR_OPTIONS_V042__.__backV034.press()")
    if not mm('portrait'):raise SystemExit('menu return from options failed')

    d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('MusicPlayerSceneV10')")
    if not wait("return !!window.__KELVOR_MUSIC_V042__&&window.__KELVOR_MUSIC_V042__.scene?.isActive?.()===true;"):raise SystemExit('music v042 not ready')
    time.sleep(.35);shot('music_portrait.png');R['checks']['music_portrait_exclusive']=exclusive('MusicPlayerSceneV10') and bool(d.execute_script("return !!window.__KELVOR_MUSIC_V042__.__backV034?.box?.visible&&!!window.__KELVOR_MUSIC_V042__.__v042?.portraitPolish;"))
    d.execute_script("window.__KELVOR_MUSIC_V042__.__backV034.press()")
    if not mm('portrait'):raise SystemExit('menu return from music failed')

    d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('CreditsSceneV10')")
    if not wait("return !!window.__KELVOR_CREDITS_V042__&&window.__KELVOR_CREDITS_V042__.scene?.isActive?.()===true;"):raise SystemExit('credits v042 not ready')
    time.sleep(.35);shot('credits_portrait.png');R['checks']['credits_portrait_exclusive']=exclusive('CreditsSceneV10') and bool(d.execute_script("return !!window.__KELVOR_CREDITS_V042__.__backV034?.box?.visible&&!!window.__KELVOR_CREDITS_V042__.__v042?.portraitPolish;"))
    d.execute_script("window.__KELVOR_CREDITS_V042__.__backV034.press()")
    if not mm('portrait'):raise SystemExit('menu return from credits failed')

    d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('WorldMapSceneRC1')")
    if not wm('portrait'):raise SystemExit('portrait map not ready')
    time.sleep(.45);shot('map_portrait_1.png');p1=map_metrics();R['map_portrait_1']=p1
    R['checks']['map_portrait_exclusive']=exclusive('WorldMapSceneRC1');R['checks']['map_portrait_large']=p1['map']['w']>=p1['w']*.78;R['checks']['map_nodes_authored']=p1.get('route') and all(x['inside'] for x in p1['nodes']);R['checks']['map_portrait_controls']=all(x['inside'] for x in p1['buttons']);R['checks']['map_no_rotate_overlay']=not any('GIRE O CELULAR' in t.upper() for t in p1['texts'])
    setsize(LANDSCAPE)
    if not wm('landscape'):raise SystemExit('landscape map not ready')
    time.sleep(.4);shot('map_landscape.png');l1=map_metrics();R['checks']['map_landscape_exclusive']=exclusive('WorldMapSceneRC1');R['checks']['map_landscape_large']=l1['map']['w']>=315;R['checks']['map_landscape_nodes']=l1.get('route') and all(x['inside'] for x in l1['nodes']) and all(x['inside'] for x in l1['buttons'])
    setsize(PORTRAIT)
    if not wm('portrait'):raise SystemExit('portrait map repeat failed')
    time.sleep(.4);shot('map_portrait_2.png');p2=map_metrics();R['checks']['map_portrait_repeat']=abs(p1['map']['w']-p2['map']['w'])<=4 and p1['nodes']==p2['nodes']

    d.execute_script("window.__KELVOR_WORLD_MAP_V039__.scene.start('MainMenuSceneV10')")
    if not mm('portrait'):raise SystemExit('menu reentry failed')
    d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('WorldMapSceneRC1')")
    if not wm('portrait'):raise SystemExit('map reentry failed')
    time.sleep(.35);shot('map_portrait_reentry.png');R['checks']['reentry_exclusive']=exclusive('WorldMapSceneRC1')

    d.get(f'http://127.0.0.1:{port}/index.html?v=042qa_reload')
    if not mm('portrait'):raise SystemExit('reload menu failed')
    time.sleep(.35);shot('menu_portrait_reload.png');R['checks']['reload_menu_exclusive']=exclusive('MainMenuSceneV10')
    d.execute_script("window.__KELVOR_MAIN_MENU_V039__.scene.start('WorldMapSceneRC1')")
    if not wm('portrait'):raise SystemExit('reload map failed')
    time.sleep(.35);shot('map_portrait_reload.png');R['checks']['reload_map_exclusive']=exclusive('WorldMapSceneRC1')

    d.execute_script("window.__KELVOR_WORLD_MAP_V039__.scene.start('MainMenuSceneV10')")
    if not mm('portrait'):raise SystemExit('desktop pre-menu failed')
    setsize(DESKTOP)
    if not mm('landscape'):raise SystemExit('desktop menu failed')
    time.sleep(.4);shot('menu_desktop.png');R['checks']['desktop_menu_exclusive']=exclusive('MainMenuSceneV10')
    vals=list(R['checks'].values());R['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2);R['status']='PASS' if all(vals) else 'FAIL'
    (out/'RESULT.json').write_text(json.dumps(R,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(R,ensure_ascii=True,indent=2));return 0 if R['status']=='PASS' else 1
  finally:
    try:d.quit()
    except:pass
    srv.shutdown();srv.server_close()
if __name__=='__main__':raise SystemExit(main())
