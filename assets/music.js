/* 背景音樂 v1(2026-10-22)—— 每一頁的「音樂」按鈕:選曲、關閉音樂、調音量。
   ‧ 自成一體:按鈕、面板、樣式都由這支程式建立,不動 book.js / book.css。
   ‧ 曲目寫在下面的 TRACKS(音檔放在 audio/ 資料夾,用相對路徑);TRACKS 是空的就什麼都不顯示。
   ‧ 瀏覽器規定「沒有人操作就不能出聲」,所以預設是:訪客第一次點擊、翻頁或按鍵之後才開始播。
   ‧ 讀者的選擇(哪一首、開或關、音量、播到哪裡)存在他自己瀏覽器的 localStorage,換頁會接著播;
     儲存失敗(無痕模式等)也不影響使用,只是換頁會重新開始。
   ‧ 把 DEFAULT_ON 改成 false:訪客第一次來預設是關閉,要按「音樂」才會播。 */
(function(){
  'use strict';
  var DEFAULT_ON=true, DEFAULT_VOL=0.5;
  var TRACKS=window.MUSIC_TRACKS||[
    /*TRACKS*/
  ];
  if(!TRACKS||!TRACKS.length)return;
  var KEY='jz10-music-v1',doc=document,win=window;

  function find(id){for(var i=0;i<TRACKS.length;i++){if(TRACKS[i].id===id)return TRACKS[i]}return null}
  function defTrack(){for(var i=0;i<TRACKS.length;i++){if(TRACKS[i].def)return TRACKS[i]}return TRACKS[0]}   /* 第一次來的訪客先播這一首 */
  function load(){
    var s=null;try{s=JSON.parse(win.localStorage.getItem(KEY)||'null')}catch(e){}
    if(!s||typeof s!=='object')s={};
    var o={on:typeof s.on==='boolean'?s.on:DEFAULT_ON,id:s.id,t:+s.t||0,ts:+s.ts||0,
           v:(typeof s.v==='number'&&s.v>=0&&s.v<=1)?s.v:DEFAULT_VOL};
    if(!find(o.id))o.id=defTrack().id;
    return o;
  }

  var CSS=[
    ':root{--mu-bg:#fff;--mu-fg:#2B332F;--mu-dim:#5E6A64;--mu-line:#C5CCC6;--mu-acc:#B98C3E;--mu-sel:#F3EBDA;--mu-sh:0 8px 28px rgba(0,0,0,.22)}',
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--mu-bg:#1E2427;--mu-fg:#E4E8E4;--mu-dim:#93A09A;--mu-line:#344047;--mu-acc:#E0C384;--mu-sel:#2B3338;--mu-sh:0 8px 28px rgba(0,0,0,.55)}}',
    ':root[data-theme="dark"]{--mu-bg:#1E2427;--mu-fg:#E4E8E4;--mu-dim:#93A09A;--mu-line:#344047;--mu-acc:#E0C384;--mu-sel:#2B3338;--mu-sh:0 8px 28px rgba(0,0,0,.55)}',
    'header .r{flex-wrap:wrap;justify-content:flex-end}',
    '.mu-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-height:40px;min-width:40px;padding:0 14px 0 12px;margin:0;',
    ' font:700 15px/1 var(--sans,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif);letter-spacing:.04em;white-space:nowrap;cursor:pointer;',
    ' color:var(--btn-fg,var(--bg,#F4F6F3));background:var(--btn,var(--fg,#2B332F));border:0;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.28);-webkit-tap-highlight-color:transparent}',
    '.mu-btn:hover{opacity:.88}',
    '.mu-btn:focus-visible,.mu-panel button:focus-visible,.mu-it input:focus-visible,.mu-vol input:focus-visible{outline:3px solid var(--gold2,#B98C3E);outline-offset:2px}',
    '.mu-btn svg{width:18px;height:18px;flex:none;display:block}',
    '.mu-btn .mu-s0{stroke:var(--btn,var(--fg,#2B332F));stroke-width:5;display:none}',
    '.mu-btn .mu-s1{display:none}',
    '.mu-btn[data-s="off"] .mu-s0,.mu-btn[data-s="off"] .mu-s1{display:inline}',
    '.mu-btn[data-s="off"] .mu-n{opacity:.75}',
    '.mu-eq{display:none;align-items:flex-end;gap:2px;height:14px}',
    '.mu-btn[data-s="on"] .mu-eq{display:inline-flex}',
    '.mu-eq i{display:block;width:3px;height:100%;background:currentColor;border-radius:1px;transform-origin:bottom;animation:mu-b 1.1s ease-in-out infinite}',
    '.mu-eq i:nth-child(2){animation-delay:-.4s}.mu-eq i:nth-child(3){animation-delay:-.75s}',
    '@keyframes mu-b{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}',
    '.mu-btn[data-s="wait"]{animation:mu-p 1.8s ease-out infinite}',
    '@keyframes mu-p{0%{box-shadow:0 0 0 0 rgba(185,140,62,.75)}70%,100%{box-shadow:0 0 0 11px rgba(185,140,62,0)}}',
    '@media (prefers-reduced-motion:reduce){.mu-eq i{animation:none;transform:scaleY(.7)}.mu-btn[data-s="wait"]{animation:none;outline:3px solid var(--gold2,#B98C3E);outline-offset:2px}}',
    '@media (max-width:600px){.mu-btn{min-height:44px;min-width:44px}}',
    '@media (max-width:480px){.mu-lb{display:none}.mu-btn{padding:0;width:44px}}',
    '@media (max-width:380px){header .r{gap:6px}header select{max-width:34vw}}',
    '@media (max-height:520px){.mu-lb{display:none}.mu-btn{min-height:34px;min-width:34px;width:34px;padding:0}.mu-btn svg{width:16px;height:16px}}',
    '.mu-fixed{position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:50}',
    'body.mu-idx h1{padding-right:56px;text-wrap:balance}',
    '.mu-panel{position:fixed;z-index:9999;box-sizing:border-box;width:min(320px,calc(100vw - 20px));max-height:calc(100vh - 20px);max-height:calc(100dvh - 20px);overflow:auto;',
    ' background:var(--mu-bg);color:var(--mu-fg);border:1px solid var(--mu-line);border-radius:14px;box-shadow:var(--mu-sh);padding:12px 12px 10px;',
    ' font:400 15px/1.45 var(--sans,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif);-webkit-overflow-scrolling:touch}',
    '.mu-panel[hidden]{display:none}',
    '.mu-h{display:flex;align-items:center;justify-content:space-between;margin:0 0 6px 4px}',
    '.mu-h b{font:700 16px/1.3 var(--serif,"Noto Serif TC","Songti TC",serif);letter-spacing:.08em}',
    '.mu-x{flex:none;width:40px;height:40px;margin:-4px -4px -4px 0;padding:0;border:0;border-radius:50%;background:transparent;color:var(--mu-dim);font:400 26px/1 var(--sans,sans-serif);cursor:pointer}',
    '.mu-x:hover{background:var(--mu-sel)}',
    '.mu-it{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 10px;border:1px solid transparent;border-radius:10px;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '.mu-it:hover{background:var(--mu-sel)}',
    '.mu-it.sel{background:var(--mu-sel);border-color:var(--mu-line)}',
    '.mu-it input{flex:none;width:20px;height:20px;margin:0;accent-color:var(--mu-acc)}',
    '.mu-tx{display:flex;flex-direction:column;flex:1;min-width:0}',
    '.mu-tx b{font-weight:700}',
    '.mu-tx small{color:var(--mu-dim);font-size:12.5px;line-height:1.35}',
    '.mu-it .mu-eq{height:12px;color:var(--mu-acc)}',
    '.mu-it.pl .mu-eq{display:inline-flex}',
    '.mu-vol{display:flex;align-items:center;gap:10px;margin:6px 4px 0 10px;min-height:40px}',
    '.mu-vol input{flex:1;min-width:0;margin:0;accent-color:var(--mu-acc)}',
    '.mu-note{margin:4px 10px 0;font-size:12.5px;line-height:1.5;color:var(--mu-dim)}',
    '.mu-note:empty{display:none}'
  ].join('\n');

  function init(){
    var st=load(),cur=null,seekTo=null,pending=false,failed=false,playing=false,lastSave=0,isOpen=false,listening=false;
    var au;try{au=new Audio()}catch(e){return}
    au.preload='none';au.loop=true;au.setAttribute('playsinline','');
    var volOK=false;try{au.volume=0.37;volOK=Math.abs(au.volume-0.37)<0.01}catch(e){}
    try{au.volume=st.v}catch(e){}

    function save(){try{win.localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
    function pick(id){var tr=find(id)||defTrack();if(cur!==tr){cur=tr;au.src=tr.src;seekTo=null}return tr}

    au.addEventListener('loadedmetadata',function(){
      if(seekTo!=null&&isFinite(au.duration)&&au.duration>0){try{au.currentTime=seekTo%au.duration}catch(e){}}
      seekTo=null;
    });

    function media(){
      try{
        if(!('mediaSession' in navigator)||!cur)return;
        navigator.mediaSession.metadata=new win.MediaMetadata({title:'地藏滅定業真言・'+cur.name,artist:'地藏十輪經 漫畫書',album:'背景音樂'});
        navigator.mediaSession.setActionHandler('play',function(){st.on=true;save();play()});
        navigator.mediaSession.setActionHandler('pause',function(){turnOff()});
      }catch(e){}
    }

    var EV=['pointerup','touchend','click','keydown'];
    function onGesture(e){
      if(!st.on||!au.paused)return;
      var t=e.target;if(t&&t.nodeType===1&&(btn.contains(t)||pn.contains(t)))return;
      play();
    }
    function listen(){if(listening)return;listening=true;for(var i=0;i<EV.length;i++)doc.addEventListener(EV[i],onGesture,true)}
    function unlisten(){if(!listening)return;listening=false;for(var i=0;i<EV.length;i++)doc.removeEventListener(EV[i],onGesture,true)}

    function play(){
      if(!st.on)return;
      pick(st.id);
      pending=false;
      if(failed){failed=false;try{au.load()}catch(e){}}   /* 上次載入失敗:使用者再按時重新載入 */
      var p;try{p=au.play()}catch(e){p=null}
      if(p&&typeof p.then==='function'){
        p.then(function(){pending=false;failed=false;unlisten();ui();media()},
               function(err){var n=err&&err.name;if(n==='AbortError')return;
                 if(n==='NotAllowedError'){pending=true;listen()}else{failed=true}
                 ui()});
      }
    }
    function turnOff(){st.on=false;pending=false;failed=false;try{au.pause()}catch(e){}unlisten();save();ui()}
    function choose(id){
      var same=cur&&cur.id===id;
      st.on=true;st.id=id;failed=false;
      if(!same){st.t=0;st.ts=Date.now()}
      pick(id);save();play();ui();
    }

    au.addEventListener('timeupdate',function(){var n=Date.now();if(n-lastSave>1500){lastSave=n;st.t=au.currentTime||0;st.ts=n;save()}});
    function flush(){if(!au.paused&&cur){st.t=au.currentTime||0;st.ts=Date.now();save()}}
    win.addEventListener('pagehide',flush);
    doc.addEventListener('visibilitychange',function(){if(doc.visibilityState==='hidden')flush();else if(st.on&&!playing&&!failed)play()});
    au.addEventListener('playing',function(){playing=true;pending=false;failed=false;ui()});
    au.addEventListener('pause',function(){playing=false;ui()});
    au.addEventListener('ended',function(){playing=false;ui()});
    au.addEventListener('emptied',function(){playing=false;ui()});
    au.addEventListener('error',function(){playing=false;if(st.on)failed=true;ui()});

    /* ───── 介面 ───── */
    var sty=doc.createElement('style');sty.id='mu-css';sty.appendChild(doc.createTextNode(CSS));(doc.head||doc.documentElement).appendChild(sty);

    var btn=doc.createElement('button');btn.type='button';btn.className='mu-btn';btn.id='mu-btn';
    btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','mu-panel');
    btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
      '<g class="mu-n"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></g>'+
      '<path class="mu-s0" d="M3 3l18 18"/><path class="mu-s1" d="M3 3l18 18"/></svg>'+
      '<span class="mu-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="mu-lb">音樂</span>';
    var r=doc.querySelector('header .r');
    if(r){r.insertBefore(btn,r.firstChild)}
    else{btn.className+=' mu-fixed';doc.body.className+=(doc.body.className?' ':'')+'mu-idx';doc.body.appendChild(btn)}

    var fitT=0;
    function fit(){
      try{
        var hd=r&&r.parentNode,sel=r&&r.querySelector('select');
        if(!hd||!sel)return;
        sel.style.maxWidth='';
        var h=hd.offsetHeight;if(!h)return;
        btn.style.display='none';var h0=hd.offsetHeight;btn.style.display='';
        if(h<=h0)return;                                   /* 沒有因為音樂鈕而變高,什麼都不用動 */
        var w=sel.offsetWidth;
        while(w>120){w-=8;sel.style.maxWidth=w+'px';if(hd.offsetHeight<=h0)return}
        sel.style.maxWidth='';                             /* 縮到最小還是擠不下:維持原本的換行 */
      }catch(e){}
    }
    function fitSoon(){clearTimeout(fitT);fitT=setTimeout(fit,80)}

    var pn=doc.createElement('div');pn.id='mu-panel';pn.className='mu-panel';pn.hidden=true;
    pn.setAttribute('role','dialog');pn.setAttribute('aria-label','背景音樂');
    var hd=doc.createElement('div');hd.className='mu-h';
    var ht=doc.createElement('b');ht.textContent='背景音樂';hd.appendChild(ht);
    var xb=doc.createElement('button');xb.type='button';xb.className='mu-x';xb.setAttribute('aria-label','關閉選單');xb.textContent='×';hd.appendChild(xb);
    pn.appendChild(hd);
    var list=doc.createElement('div');list.setAttribute('role','radiogroup');list.setAttribute('aria-label','選擇音樂');
    var items={};
    function item(value,name,note,eq){
      var lb=doc.createElement('label');lb.className='mu-it';
      var inp=doc.createElement('input');inp.type='radio';inp.name='mu-track';inp.value=value;
      var tx=doc.createElement('span');tx.className='mu-tx';
      var b=doc.createElement('b');b.textContent=name;tx.appendChild(b);
      if(note){var s=doc.createElement('small');s.textContent=note;tx.appendChild(s)}
      lb.appendChild(inp);lb.appendChild(tx);
      if(eq){var e=doc.createElement('span');e.className='mu-eq';e.setAttribute('aria-hidden','true');e.innerHTML='<i></i><i></i><i></i>';lb.appendChild(e)}
      list.appendChild(lb);items[value]={lb:lb,inp:inp};
    }
    item('off','關閉音樂','',false);
    for(var i=0;i<TRACKS.length;i++)item(TRACKS[i].id,TRACKS[i].name,TRACKS[i].note||'',true);
    pn.appendChild(list);
    var vrow=doc.createElement('label');vrow.className='mu-vol';
    var vt=doc.createElement('span');vt.textContent='音量';
    var vol=doc.createElement('input');vol.type='range';vol.min='0';vol.max='100';vol.step='5';vol.setAttribute('aria-label','音量');
    vrow.appendChild(vt);vrow.appendChild(vol);if(!volOK)vrow.style.display='none';
    pn.appendChild(vrow);
    var note=doc.createElement('p');note.className='mu-note';pn.appendChild(note);
    doc.body.appendChild(pn);

    function ui(){
      var isPlaying=st.on&&playing;
      var s=!st.on?'off':playing?'on':failed?'bad':pending?'wait':'load';
      btn.setAttribute('data-s',s);
      var tip=s==='on'?'音樂播放中:'+(cur?cur.name:'')+'(點一下選曲或關閉)':s==='off'?'音樂已關閉(點一下選擇音樂)':s==='wait'?'點一下開始播放音樂':s==='load'?'音樂載入中…(點一下選曲或關閉)':'音樂載入失敗(點一下選擇音樂)';
      btn.title=tip;btn.setAttribute('aria-label',tip);
      for(var k in items){if(!items.hasOwnProperty(k))continue;
        var on=(k==='off')?!st.on:(st.on&&cur&&cur.id===k);
        items[k].inp.checked=!!on;
        items[k].lb.className='mu-it'+(on?' sel':'')+(on&&isPlaying&&k!=='off'?' pl':'');
      }
      vol.value=String(Math.round(st.v*100));
      note.textContent=s==='bad'?'音檔載入失敗,請檢查網路後再試一次。':s==='wait'?'瀏覽器需要您點一下,才會開始播放。':'';
      if(isOpen)place();
    }
    function place(){
      var b=btn.getBoundingClientRect(),w=pn.offsetWidth,h=pn.offsetHeight,
          vw=doc.documentElement.clientWidth||win.innerWidth,vh=win.innerHeight,m=10;
      var left=Math.min(Math.max(m,b.right-w),Math.max(m,vw-w-m));
      var top=b.bottom+8;
      if(top+h>vh-m)top=b.top-h-8;
      if(top<m)top=m;
      if(top+h>vh-m)top=Math.max(m,vh-h-m);
      pn.style.left=left+'px';pn.style.top=top+'px';
    }
    function openP(){isOpen=true;pn.hidden=false;btn.setAttribute('aria-expanded','true');place();
      var c=pn.querySelector('input:checked');if(c){try{c.focus({preventScroll:true})}catch(e){}}}   /* 焦點移進面板:方向鍵用來選曲,不會翻書;外框只在用鍵盤時才顯示(:focus-visible) */
    function closeP(ret){isOpen=false;pn.hidden=true;btn.setAttribute('aria-expanded','false');if(ret){try{btn.focus()}catch(e){}}}

    btn.addEventListener('click',function(){
      if(st.on&&!playing)play();   /* 這一下點擊本身就是「使用者操作」 */
      if(isOpen)closeP(false);else openP();
    });
    xb.addEventListener('click',function(){closeP(true)});
    list.addEventListener('change',function(e){var t=e.target;if(!t||t.name!=='mu-track')return;if(t.value==='off')turnOff();else choose(t.value)});
    list.addEventListener('click',function(e){var t=e.target;if(t&&t.name==='mu-track'&&t.value!=='off'&&st.on&&!playing)play()});
    vol.addEventListener('input',function(){st.v=(+vol.value)/100;try{au.volume=st.v}catch(e){}save()});
    pn.addEventListener('keydown',function(e){e.stopPropagation()});
    doc.addEventListener('keydown',function(e){if(isOpen&&(e.key==='Escape'||e.key==='Esc'))closeP(true)},true);
    doc.addEventListener('pointerdown',function(e){if(!isOpen)return;var t=e.target;if(pn.contains(t)||btn.contains(t))return;closeP(false)},true);
    win.addEventListener('resize',function(){if(isOpen)place()});
    win.addEventListener('pageshow',function(e){if(e.persisted){st=load();ui();if(st.on&&au.paused)play()}});

    if(r){fit();win.addEventListener('resize',fitSoon);win.addEventListener('orientationchange',fitSoon);win.addEventListener('load',fitSoon);
      if(doc.fonts&&doc.fonts.ready&&doc.fonts.ready.then)doc.fonts.ready.then(fitSoon);setTimeout(fitSoon,600)}
    pick(st.id);
    if(st.t>1&&Date.now()-st.ts<600000)seekTo=st.t+1.2;   /* 換頁後接著播:同一首、10 分鐘內 */
    ui();
    if(st.on)play();                                      /* 先試一次;被瀏覽器擋下就等第一次點擊 */
  }

  try{
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){try{init()}catch(e){}});
    else init();
  }catch(e){}
})();
