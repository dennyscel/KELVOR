#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--web',required=True); ap.add_argument('--chrome',required=True); ap.add_argument('--out',required=True); a=ap.parse_args()
    web=Path(a.web).resolve(); out=Path(a.out).resolve(); out.mkdir(parents=True,exist_ok=True)
    class H(SimpleHTTPRequestHandler):
        def __init__(self,*x,**kw): super().__init__(*x,directory=str(web),**kw)
        def log_message(self,*x): pass
    srv=ThreadingHTTPServer(('127.0.0.1',0),H); threading.Thread(target=srv.serve_forever,daemon=True).start(); port=srv.server_address[1]
    o=Options(); o.binary_location=a.chrome
    for f in ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--window-size=1536,691']: o.add_argument(f)
    d=webdriver.Chrome(options=o)
    result={'checks':{},'screenshots':[],'status':'FAIL'}
    try:
        d.get(f'http://127.0.0.1:{port}/index.html?v=034qa')
        deadline=time.monotonic()+30
        while time.monotonic()<deadline:
            time.sleep(.2)
            ready=d.execute_script("return !!window.__KELVOR_GAME_RC3__ && !!window.__KELVOR_RC39_MENU_MAP_V034_READY__ && !!window.__KELVOR_MAIN_MENU_V034__;")
            if ready: break
        else: raise SystemExit('v034/menu not ready')
        time.sleep(.8)
        d.save_screenshot(str(out/'menu_landscape.png')); result['screenshots'].append('menu_landscape.png')
        menu=d.execute_script("""
          const s=window.__KELVOR_MAIN_MENU_V034__, w=s.scale.width,h=s.scale.height;
          const buttons=(s.ui||[]).map(b=>({x:b.box.x,y:b.box.y,w:b.box.width,h:b.box.height,label:b.label.text,visible:b.box.visible}));
          return {w,h,flag:s.__v034||null,buttons,screen:document.documentElement.dataset.kelvorScreen};
        """)
        result['menu']=menu
        result['checks']['menu_flag']=bool(menu.get('flag',{}).get('premium'))
        result['checks']['menu_fullscreen']=any('TELA CHEIA' in b.get('label','') and b.get('visible') for b in menu['buttons'])
        result['checks']['menu_start']=any(b.get('label')=='JOGAR AGORA' and b.get('visible') for b in menu['buttons'])

        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('OptionsSceneV10')")
        deadline=time.monotonic()+8
        while time.monotonic()<deadline:
            time.sleep(.15)
            if d.execute_script("return !!window.__KELVOR_OPTIONS_V001__?.__backV034;"): break
        d.save_screenshot(str(out/'options_landscape.png')); result['screenshots'].append('options_landscape.png')
        opt=d.execute_script("""
          const s=window.__KELVOR_OPTIONS_V001__,b=s.__backV034;
          return {back:!!b,backLabel:b?.label?.text||null,backVisible:!!b?.box?.visible,title:(s.children.list||[]).find(o=>o.type==='Text'&&o.text==='OPÇÕES')?.text||null};
        """)
        result['options']=opt
        result['checks']['options_back_visible']=bool(opt.get('back') and opt.get('backVisible') and 'VOLTAR' in (opt.get('backLabel') or ''))
        d.execute_script("window.__KELVOR_OPTIONS_V001__.__backV034.press()")
        time.sleep(.5)
        result['checks']['options_back_returns_menu']=bool(d.execute_script("return !!window.__KELVOR_MAIN_MENU_V034__?.scene?.isActive?.();"))

        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('WorldMapSceneRC1')")
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            time.sleep(.15)
            if d.execute_script("return !!window.__KELVOR_CAMPAIGN_MAP_SCENE__?.__mapChromeV034;"): break
        time.sleep(.8)
        d.save_screenshot(str(out/'map_landscape.png')); result['screenshots'].append('map_landscape.png')
        mp=d.execute_script("""
          const s=window.__KELVOR_CAMPAIGN_MAP_SCENE__,c=s.__mapChromeV034,w=s.scale.width,h=s.scale.height;
          const B=b=>b?({x:b.box.x,y:b.box.y,w:b.box.width,h:b.box.height,label:b.label.text,visible:b.box.visible}):null;
          const bounds=c?{panel:{x:c.mapPanel.x,y:c.mapPanel.y,w:c.mapPanel.displayWidth,h:c.mapPanel.displayHeight},prev:B(c.prev),play:B(c.play),next:B(c.next),fs:B(c.fs)}:null;
          return {flag:s.__v034||null,selected:s.selected,bounds,old:{prev:s.prev?.visible,enter:s.enter?.visible,next:s.next?.visible,wp:s.worldPrevRC9?.visible,wn:s.worldNextRC9?.visible},nodeTitle:c?.nodeTitle?.text||null,nodeState:c?.nodeState?.text||null,w,h};
        """)
        result['map']=mp
        result['checks']['map_flag']=bool(mp.get('flag',{}).get('animated') and mp.get('flag',{}).get('technicalButtonsHidden'))
        result['checks']['map_old_buttons_hidden']=not any(bool(v) for v in (mp.get('old') or {}).values())
        result['checks']['map_play_visible']=bool((mp.get('bounds') or {}).get('play',{}).get('visible') and (mp.get('bounds') or {}).get('play',{}).get('label')=='JOGAR FASE')
        result['checks']['map_title_present']=bool(mp.get('nodeTitle') and mp.get('nodeState'))

        d.set_window_rect(width=915,height=412); time.sleep(1)
        d.save_screenshot(str(out/'map_small_landscape.png')); result['screenshots'].append('map_small_landscape.png')
        small=d.execute_script("""
          const s=window.__KELVOR_CAMPAIGN_MAP_SCENE__,c=s.__mapChromeV034,w=s.scale.width,h=s.scale.height;
          const inside=b=>b&&b.box.visible&&b.box.x-b.box.width/2>=0&&b.box.x+b.box.width/2<=w&&b.box.y-b.box.height/2>=0&&b.box.y+b.box.height/2<=h;
          return {w,h,prev:inside(c.prev),play:inside(c.play),next:inside(c.next),fs:inside(c.fs),card:c.nodeCard.x-c.nodeCard.displayWidth/2>=0&&c.nodeCard.x+c.nodeCard.displayWidth/2<=w};
        """)
        result['responsive']=small
        result['checks']['small_landscape_controls_inside']=all(small.get(k) for k in ['prev','play','next','fs','card'])

        d.execute_script("window.__KELVOR_GAME_RC3__.scene.start('MainMenuSceneV10')"); time.sleep(1)
        d.save_screenshot(str(out/'menu_small_landscape.png')); result['screenshots'].append('menu_small_landscape.png')
        smenu=d.execute_script("""
          const s=window.__KELVOR_MAIN_MENU_V034__,w=s.scale.width,h=s.scale.height;
          const inside=b=>b&&b.box.visible&&b.box.x-b.box.width/2>=0&&b.box.x+b.box.width/2<=w&&b.box.y-b.box.height/2>=0&&b.box.y+b.box.height/2<=h;
          return {w,h,allButtons:(s.ui||[]).every(inside)};
        """)
        result['menu_responsive']=smenu
        result['checks']['small_menu_buttons_inside']=bool(smenu.get('allButtons'))

        vals=list(result['checks'].values()); result['technical_score']=round(10*sum(bool(v) for v in vals)/max(1,len(vals)),2)
        result['status']='PASS' if all(vals) else 'FAIL'
        (out/'RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0 if result['status']=='PASS' else 1
    finally:
        try:d.quit()
        except:pass
        srv.shutdown();srv.server_close()

if __name__=='__main__': raise SystemExit(main())
