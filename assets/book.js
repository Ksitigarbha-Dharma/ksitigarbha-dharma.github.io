/* 翻頁書主程式 v5(視窗自動適應、回首頁按鈕寫在檔尾):讀 window.BOOK,組出所有頁面,交給 St.PageFlip。
   網址加 ?audit=篇號(或 toc / all)會改成「平鋪總覽」,給檢查用,頁面是同一套程式組出來的。 */
(function(){
  'use strict';
  var D=window.BOOK, root=document.getElementById('book');
  var Q={};
  (location.search||'').replace(/^\?/,'').split('&').forEach(function(kv){if(kv){var a=kv.split('=');Q[a[0]]=decodeURIComponent(a[1]||'')}});
  var AUDIT=Q.audit||'';
  var FB='https://www.facebook.com/Ksitigarbhabodishava';
  var ROWS=5;                                        // 目錄每頁最多幾篇

  var pages=[],imgs=[],postOf=[],kinds=[],imgNo=[],postStart={};
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function S(html){var d=document.createElement('div');d.innerHTML=html;return d.firstChild}
  function add(page,o){o=o||{};pages.push(page);imgs.push(o.img||null);postOf.push(o.post||0);kinds.push(o.kind||'');imgNo.push(o.no||0);root.appendChild(page)}
  function lazyImg(src,alt){var im=document.createElement('img');im.alt=alt;im.setAttribute('data-src',src);im.decoding='async';return im}

  /* ── 小圖樣(行內 SVG,顏色跟著文字色) ── */
  var FRAME='<svg class="frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
    +'<rect x="3.4" y="3.4" width="93.2" height="93.2" rx=".8" fill="none" stroke="currentColor" stroke-width=".34"/>'
    +'<rect x="4.7" y="4.7" width="90.6" height="90.6" fill="none" stroke="currentColor" stroke-width=".12"/>'
    +'<g fill="none" stroke="currentColor" stroke-width=".7" stroke-linecap="square"><path d="M3.4 10.4V3.4h7"/><path d="M89.6 3.4h7v7"/><path d="M3.4 89.6v7h7"/><path d="M96.6 89.6v7h-7"/></g>'
    +'<g fill="currentColor"><path d="M6.6 5.6l1 1-1 1-1-1z"/><path d="M93.4 5.6l1 1-1 1-1-1z"/><path d="M6.6 92.4l1 1-1 1-1-1z"/><path d="M93.4 92.4l1 1-1 1-1-1z"/></g></svg>';
  var LOTUS='<svg class="lotus" viewBox="0 0 60 28" aria-hidden="true" focusable="false"><g fill="currentColor">'
    +'<path d="M30 2.5C35.4 9 35.4 18.6 30 26 24.6 18.6 24.6 9 30 2.5z"/>'
    +'<path transform="rotate(33 30 26)" d="M30 5.5C34.8 11.4 34.8 19.4 30 26 25.2 19.4 25.2 11.4 30 5.5z" opacity=".82"/>'
    +'<path transform="rotate(-33 30 26)" d="M30 5.5C34.8 11.4 34.8 19.4 30 26 25.2 19.4 25.2 11.4 30 5.5z" opacity=".82"/>'
    +'<path transform="rotate(64 30 26)" d="M30 10C33.6 14.4 33.6 20 30 26 26.4 20 26.4 14.4 30 10z" opacity=".62"/>'
    +'<path transform="rotate(-64 30 26)" d="M30 10C33.6 14.4 33.6 20 30 26 26.4 20 26.4 14.4 30 10z" opacity=".62"/>'
    +'</g><path d="M7 26.8h46" fill="none" stroke="currentColor" stroke-width=".7" opacity=".55"/></svg>';
  function wheel(){   // 十輪:10 根輪輻、10 顆輪緣珠
    var s='<svg class="wheel" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor">'
      +'<circle cx="50" cy="50" r="41" stroke-width="1.5"/><circle cx="50" cy="50" r="35.5" stroke-width=".5"/>'
      +'<circle cx="50" cy="50" r="9.5" stroke-width="1.3"/><circle cx="50" cy="50" r="5.2" stroke-width=".6"/>';
    var k,a;
    for(k=0;k<10;k++){a=k*Math.PI/5-Math.PI/2;
      s+='<line x1="'+(50+Math.cos(a)*9.5).toFixed(2)+'" y1="'+(50+Math.sin(a)*9.5).toFixed(2)+'" x2="'+(50+Math.cos(a)*35.5).toFixed(2)+'" y2="'+(50+Math.sin(a)*35.5).toFixed(2)+'" stroke-width="1.1"/>'}
    s+='</g><g fill="currentColor"><circle cx="50" cy="50" r="2.2"/>';
    for(k=0;k<10;k++){a=k*Math.PI/5-Math.PI/2;
      s+='<circle cx="'+(50+Math.cos(a)*43.6).toFixed(2)+'" cy="'+(50+Math.sin(a)*43.6).toFixed(2)+'" r="2.5"/>'}
    return S(s+'</g></svg>');
  }
  function beads(n,total){   // 念珠進度:讀過的是金色、這一篇是朱紅、還沒讀的淡淡的
    var s='<svg class="beads" viewBox="-1 0 102 2.6" aria-hidden="true" focusable="false">';
    for(var i=1;i<=total;i++){
      var cur=i===n;
      s+='<circle cx="'+((i-.5)*100/total).toFixed(2)+'" cy="1.3" r="'+(cur?1.25:(i<n?.36:.26))+'" fill="'+(cur?'#B13F2B':'currentColor')+'" opacity="'+(cur?1:(i<n?.9:.34))+'"/>'}
    return S(s+'</svg>');
  }
  function seal(mid,pre,post,cls){
    var s=el('div','seal d'+String(mid).length+(cls?' '+cls:''));
    s.appendChild(el('i','',pre));s.appendChild(el('b','',String(mid)));s.appendChild(el('i','',post));
    return s;
  }
  function eyb(text){var e=el('div','eyb');e.appendChild(S(LOTUS));e.appendChild(el('span','',text));e.appendChild(S(LOTUS));return e}
  var BAR=String.fromCharCode(0xA6);   // 標題單位分隔:「|」=可在這裡換行、「¦」=一定在這裡換行
  function plain(s){return String(s==null?'':s).split('|').join('').split(BAR).join('')}
  /* 內文斷行小修:中文沒有空白可以斷詞,瀏覽器常把最後一行擠成 1~2 個字,或把「意思」「謗法」這種詞拆在兩行。
     這裡用零寬黏著符(U+2060)把:①同一個詞裡的字(用瀏覽器內建的中文斷詞 Intl.Segmenter,舊瀏覽器沒有就略過)
     ②「…」『…』裡的短詞 ③成對的 …… 和 —— ④最後 n 個字 黏在一起,
     不改變任何字,只是告訴瀏覽器「這幾個字別拆開」。 */
  var WJ=String.fromCharCode(0x2060),PUNC=/[。，、；：！？」』）〉》…—‧·.,;:!?)\]]/,SEG=null;
  try{if(typeof Intl!=='undefined'&&Intl.Segmenter)SEG=new Intl.Segmenter('zh-Hant',{granularity:'word'})}catch(e){SEG=null}
  /* 瀏覽器內建斷詞對佛教名相(地藏、福報、灌頂、剎帝利……)和文言常用詞不熟,會把它們切成單字,所以再補一份常用詞表:
     表裡的詞一律不讓它被換行拆開。(詞表只放 BMP 漢字,長度=字數) */
  var LEXS=['大願地藏王','地藏王菩薩','菩薩摩訶薩','地藏菩薩','一切眾生','一切有情','五濁惡世','六到彼岸','護持三寶','諸佛國土','佛燈炬明定','金剛光定','海電光定','世路光定','電光明定',
    '剎帝利種','灌頂大王','善業道','福田相','惡業障','貪瞋癡','三摩地','栴荼羅','剎帝利','善男子','善女人','善知識','出家人','佛菩薩','諸有情','無依行','有依行','觀世音','天帝釋','釋迦牟尼','波羅蜜','自在天','安靜地',
    '地藏王','摩訶薩','十種佛輪','佛輪','王輪','十輪','轉輪','出家','諸惡','惡業','惡趣','惡友','惡世','惡口','兩舌','妄語','綺語','貪瞋','諸佛','諸天','眾生','有情','福報','福田','敬田','悲田','恩田','伏藏','邊地','賢聖','毀呰','謗法','依行','盡滅','寶飾',
    '讀誦','受持','隨喜','供養','布施','持戒','忍辱','精進','禪定','智慧','三寶','合掌','頂禮','世尊','如來','菩提','云何','苾芻','獨覺','聲聞','般若','彼岸','功德','殊勝','佛陀','菩薩','地藏','灌頂','南無','件事','光定','業道','因果','慈悲','懺悔','修行','佛法','經典'];
  LEXS=LEXS.concat(['南無大願地藏王菩薩','南無地藏王菩薩','南無觀世音菩薩','南無阿彌陀佛','南無本師釋迦牟尼佛','本師釋迦牟尼佛','那庾多頻跋羅','庾多頻跋羅','鄔波索迦','鄔波斯迦','佉羅帝耶山','佉羅帝耶','首楞伽摩','薄伽梵','陀羅尼','阿羅漢','辟支佛','婆羅門','閻浮提','須彌山',
    '勝踴躍定','福德定','勝金剛定','增上觀勝幢定','慈悲聲定','他化自在天','大記明咒','預流果者','一來果者','不還果者','阿羅漢果者','不壞身','不壞信','不壞眷屬','看護者','無生法忍','轉輪聖王','由此輪故','轉佛輪','外道邪論',
    '從座起','合掌恭敬','右膝著地','白佛言','佛言','白佛','雙足','恭敬','安住','度化','度脫','濟度','四洲','著地','邪論','外道','和柔','損惱','退失','大地','善法','白淨','異象','香雨','花雨','香雲','花雲','殊麗','鮮潔','明炬','迷方','一者','二者','三者','四者','五者','六者',
    '正勤','苾芻尼','安隱','諸漏','當知','教他','人天','灌之以水','待之以時','多財','每一種','每一個','不墮惡趣','之所','有得','下品','中品','上品',
    '地藏菩薩本願經','「地藏菩薩本願經」','白話版','新系列','接下來','敬請期待']);
  var LEXM={};
  LEXS.forEach(function(t){var k=t.charAt(0);(LEXM[k]||(LEXM[k]=[])).push(t)});
  var UNITRE=/[個件次分秒天週年條隻句聲遍輪品篇位種道項張頁歲倍頓杯碗片塊劫]/,DIGRE=/[0-9０-９]/,DIGRE2=/[0-9０-９.,]/,NUMCN=/[一二三四五六七八九十百千萬兩]/;
  var PART=/[者矣焉哉嗎呢吧啊呀喔哦啦嘛]/,ENDP=/[故已等]/,OPENB=/[「『（《〈\s]/,CLAUSE=/[，。；：、]/;   // 句尾助詞/「…故，」之類:不放在行首
  function glue(s,n){
    s=String(s==null?'':s);
    var a=Array.from(s),L=a.length,bind=[],i,j,k,x,c,cnt=0,st=L,r='',pos=0,segs,q,m,ts,t,ok;
    for(i=0;i<L;i++)bind.push(false);
    if(SEG){
      try{
        segs=Array.from(SEG.segment(s));
        for(q=0;q<segs.length;q++){
          m=Array.from(segs[q].segment).length;
          if(segs[q].isWordLike&&m>1)for(x=pos;x<pos+m-1;x++)bind[x]=true;
          pos+=m;
        }
      }catch(e){}
    }
    for(i=0;i<L-1;i++){                                  // 補充詞表
      ts=LEXM[a[i]];if(!ts)continue;
      for(q=0;q<ts.length;q++){
        t=ts[q];m=t.length;if(i+m>L)continue;
        ok=true;for(x=1;x<m;x++){if(a[i+x]!==t.charAt(x)){ok=false;break}}
        if(ok)for(x=0;x<m-1;x++)bind[i+x]=true;
      }
    }
    for(i=0;i<L-1;i++){                                  // 數字+量詞(「3 件事」「10 分鐘」「十三劫」):數字、空白、量詞不拆開
      if(DIGRE.test(a[i])||NUMCN.test(a[i])){
        j=i;while(j+1<L&&(DIGRE2.test(a[j+1])||NUMCN.test(a[j+1])))j++;
        k=j+1;while(k<L&&a[k]===' ')k++;
        if(k<L&&UNITRE.test(a[k])){for(x=i;x<k;x++)bind[x]=true}
        i=j;
      }
    }
    for(i=0;i<L;i++){
      if(a[i]==='「'||a[i]==='『'){
        c=(a[i]==='「')?'」':'』';
        for(j=i+1;j<L&&j<=i+7;j++){
          if(a[j]===c){for(x=i;x<j;x++)bind[x]=true;break}
          if(a[j]==='「'||a[j]==='『')break;
        }
      }
    }
    while(st>0&&cnt<(n||4)){st--;if(!PUNC.test(a[st]))cnt++}
    for(i=st;i<L-1;i++)bind[i]=true;
    for(i=0;i<L-1;i++){if((a[i]==='…'&&a[i+1]==='…')||(a[i]==='—'&&a[i+1]==='—'))bind[i]=true}
    for(i=1;i<L-1;i++){if(a[i]==='—'&&a[i+1]==='—'&&a[i-1]!=='—')bind[i-1]=true}   // 破折號不放在行首:和前面的字(詞)一起換行
    for(i=1;i<L;i++){                                    // 「者矣焉哉嗎呢吧啊…」、「…故,」「…已,」「…等,」不放在行首:和前面的字(詞)一起換行
      if(PUNC.test(a[i-1])||OPENB.test(a[i-1]))continue;
      if(PART.test(a[i])||(ENDP.test(a[i])&&i+1<L&&CLAUSE.test(a[i+1]))){
        bind[i-1]=true;
        if(a[i]==='者'&&i>=2&&!PUNC.test(a[i-2])&&!OPENB.test(a[i-2]))bind[i-2]=true;   // 「失道者」「行善者」:「者」連前面兩個字一起走
      }
    }
    for(i=0;i<L;i++){r+=a[i];if(bind[i]&&i<L-1)r+=WJ}
    return r;
  }
  function unitsInto(h,s){                           // 標題依「語意單位」排:| 之間不拆行,單位和單位之間才換行
    s=String(s==null?'':s);
    if(s.indexOf('|')<0&&s.indexOf(BAR)<0){h.textContent=s;return}
    var hard=false;
    s.split(new RegExp('([|'+BAR+'])')).forEach(function(u){
      if(u==='|'){hard=false;return}
      if(u===BAR){hard=true;return}
      if(!u)return;
      if(h.firstChild)h.appendChild(document.createElement(hard?'br':'wbr'));
      hard=false;
      h.appendChild(el('span','u',u));
    });
  }
  function titleEl(t1,t2){
    var h=el('h2','ttl'+(plain(t1).length>=10?' long':'')),a=el('span','t1');
    unitsInto(a,t1);h.appendChild(a);
    if(t2){var b=el('span','t2');unitsInto(b,t2);h.appendChild(b)}
    return h;
  }
  function sheet(cls,wash){
    var p=el('div','page sheet '+cls),w=el('div','wash');
    if(wash)w.style.backgroundImage='url("'+wash+'")';
    p.appendChild(w);p.appendChild(el('div','veil'));p.appendChild(S(FRAME));
    var t=el('div','txt');p.appendChild(t);
    return {p:p,t:t};
  }

  /* ── 封面 ── */
  function coverPage(){
    var o=sheet('cover',D.cover.dir+'wd.webp'),t=o.t;
    o.p.setAttribute('data-density','hard');
    t.appendChild(seal(D.cn,'第','冊'));
    t.appendChild(el('p','sup','大乘大集　地藏十輪經'));
    t.appendChild(wheel());
    var m=el('div','mid');
    m.appendChild(el('h1','',D.name));
    m.appendChild(S(LOTUS));
    m.appendChild(el('p','vol','第 '+D.from+'–'+D.to+' 篇　·　共 '+D.posts.length+' 篇'));
    t.appendChild(m);
    return o.p;
  }

  /* ── 目錄(頁數一定是偶數,篇首頁才會落在左頁) ── */
  var tocBtns=[];
  function tocPages(){
    var P=D.posts.length,T=Math.ceil(P/ROWS);if(T%2)T++;if(T<2)T=2;
    var base=Math.floor(P/T),extra=P%T,idx=0,out=[];
    for(var g=0;g<T;g++){
      var cnt=base+(g<extra?1:0),rows=D.posts.slice(idx,idx+cnt);idx+=cnt;
      var o=sheet('toc',D.cover.dir+'w1.webp'),t=o.t;
      var th=el('div','th');th.appendChild(el('b','','目錄'));
      var sp=el('span');sp.appendChild(document.createTextNode('第'+D.cn+'冊　'+D.name));sp.appendChild(document.createElement('br'));
      sp.appendChild(document.createTextNode('第 '+D.from+'–'+D.to+' 篇'));th.appendChild(sp);t.appendChild(th);
      var ul=el('ul');
      rows.forEach(function(po){
        var li=el('li'),b=el('button','row');b.type='button';b.setAttribute('data-n',po.n);
        b.setAttribute('aria-label','前往第 '+po.n+' 篇 '+po.title);
        var dot=el('span','dot d'+String(po.n).length);dot.style.backgroundImage='url("'+po.dir+'w1.webp")';dot.appendChild(el('b','',String(po.n)));
        var tt=el('span','tt');tt.appendChild(el('span','a',plain(po.t1||po.title)));if(po.t2)tt.appendChild(el('span','b',plain(po.t2)));
        b.appendChild(dot);b.appendChild(tt);b.appendChild(el('span','arr','›'));
        li.appendChild(b);ul.appendChild(li);tocBtns.push(b);
      });
      t.appendChild(ul);
      t.appendChild(el('div','pg','目錄 '+(g+1)+' / '+T));
      out.push(o.p);
    }
    return out;
  }

  /* ── 篇首頁:朱印篇號、標題、經文原文、念珠進度 ── */
  function introPage(po){
    var o=sheet('intro',po.dir+'w1.webp'),t=o.t;
    var top=el('div','top'),hd=el('div','hd');
    hd.appendChild(el('span','vol',D.name));hd.appendChild(el('span','cnt',po.n+' / '+D.total));
    top.appendChild(hd);top.appendChild(beads(po.n,D.total));t.appendChild(top);
    var head=el('div','head');head.appendChild(seal(po.n,'第','篇'));head.appendChild(titleEl(po.t1||po.title,po.t2));t.appendChild(head);
    var s=el('div','sutra');s.appendChild(el('span','tag','經文'));s.appendChild(el('p','',glue(po.sutra,3)));t.appendChild(s);
    var f=el('div','foot');f.appendChild(S(LOTUS));t.appendChild(f);
    return o.p;
  }

  /* ── 重點頁:今天的一句話 + 想一想 + 試試看 ── */
  function tagP(label,text){var p=el('p');p.appendChild(el('span','tag',label));if(text)p.appendChild(document.createTextNode(glue(text,4)));return p}
  function note(cls,label,body){                     // body:一段話,或一串(「□ 」開頭的是勾選項目,其餘是一般段落)
    var d=el('div','note '+cls),items=Array.isArray(body)?body:[body],ul=null,first=true;
    items.forEach(function(x){
      var s=String(x);
      if(s.indexOf('\u25a1 ')===0){
        if(first){d.appendChild(tagP(label,''));first=false}
        if(!ul){ul=el('ul','chk');d.appendChild(ul)}
        ul.appendChild(el('li','',glue(s.slice(2),3)));
      }else{
        ul=null;
        d.appendChild(first?tagP(label,s):el('p','',glue(s,4)));first=false;
      }
    });
    return d;
  }
  function qWidth(s){                                // 估一行有多寬(一個全形字 = 1):空白最窄、數字/英文次之,零寬字元不算
    var w=0,c;
    for(var i=0;i<s.length;i++){c=s.charCodeAt(i);w+=(c===32||c===160)?.3:(c===0x2060||c===0x200b||c===0xfeff)?0:(c<256?.56:1)}
    return w;
  }
  var QS=[['q-xl',7.8],['q-l',7],['q-m',6.2],['q-s',5.5],['q-xs',5],['q-xxs',4.6]];
  function qFit(segs,size){                          // 這個字級下,每一行(一個 segment)是否都放得下、不會被硬斷行;回傳 [是否不斷行, 總行數]
    var cpl=73.6/size-.2,lines=0,ok=true,n;          // 每行可放的字數(已扣掉 mark 左右內距)
    for(var j=0;j<segs.length;j++){n=Math.ceil(qWidth(segs[j])/cpl-.001);if(n>1)ok=false;lines+=Math.max(1,n)}
    return [ok,lines];
  }
  function qClass(segs){                             // 金句每一行都是人工斷好的語意單位:挑「每行都不被斷開」的最大字級
    var i,r;
    for(i=0;i<QS.length;i++){r=qFit(segs,QS[i][1]);if(r[0]&&r[1]*QS[i][1]*1.5<=27)return QS[i][0]}
    for(i=0;i<QS.length;i++){r=qFit(segs,QS[i][1]);if(r[0]&&r[1]*QS[i][1]*1.5*.78<=27)return QS[i][0]}   // 行數多:容許 fit() 把金句縮到 78%
    return 'q-xxs';
  }
  function keyPage(po){
    var o=sheet('key',po.dir+'w2.webp'),t=o.t;
    t.appendChild(eyb('今天的重點'));
    var segs=(po.q&&po.q.length)?po.q:[po.quote||''];
    var qc=el('figure','qcard '+qClass(segs));
    qc.appendChild(el('span','br o'));
    var bq=el('blockquote');
    segs.forEach(function(sg){var sp=el('span','qs');sp.appendChild(el('mark','',sg));bq.appendChild(sp)});
    qc.appendChild(bq);
    qc.appendChild(el('span','br c'));
    if(po.by!==false)qc.appendChild(el('figcaption','','—— '+(po.by||'聖嚴法師')));
    t.appendChild(qc);
    if(po.think||(po.act&&po.act.length)){
      var ns=el('div','notes');
      if(po.think)ns.appendChild(note('think','想一想',po.think));
      if(po.act&&po.act.length)ns.appendChild(note('act','試試看',po.act));
      t.appendChild(ns);
    }else{
      o.p.classList.add('solo');
      var f=el('div','foot');f.appendChild(S(LOTUS));t.appendChild(f);
    }
    return o.p;
  }

  /* ── 預告頁(第 100 篇改成圓滿頁) ── */
  function nextPage(po){
    if(!po.next_n)return endPage(po);
    var o=sheet('nxt',po.next_dir?po.next_dir+'w1.webp':po.dir+'w2.webp'),t=o.t;
    t.appendChild(eyb('下一篇預告'));
    var m=el('div','main'),r=el('div','row1');
    var pl=el('figure','plate'),pic=el('div','pic'),im=lazyImg(po.next_img,'第 '+po.next_n+' 篇 預告圖');
    pic.appendChild(im);pl.appendChild(pic);r.appendChild(pl);
    var tc=el('div','tcol');tc.appendChild(seal(po.next_n,'第','篇','sm'));tc.appendChild(titleEl(po.nt1||po.next_title,po.nt2));r.appendChild(tc);
    m.appendChild(r);
    if(po.next_blurb)m.appendChild(el('p','blurb',glue(po.next_blurb,4)));
    if(po.go){
      var a=el('a','cta','前往第'+po.go.cn+'冊 · '+po.go.name+'  ›');
      a.href='book'+po.go.no+'.html#'+po.go.n;m.appendChild(a);
    }
    t.appendChild(m);
    return {p:o.p,img:im};
  }
  function endPage(po){
    var o=sheet('end',po.dir+'w2.webp'),t=o.t;
    t.appendChild(S(LOTUS));
    t.appendChild(el('h2','','圓滿'));
    t.appendChild(el('p','thx','感恩大家，一路同行'));
    if(po.series_next)t.appendChild(el('p','new',glue(po.series_next)));
    var fa=el('a','cta s','追蹤粉絲專頁  ›');fa.href=FB;fa.target='_blank';fa.rel='noopener';t.appendChild(fa);
    return {p:o.p,img:null};
  }

  /* ── 封底:每冊最後一篇的「免費索取」圖 + 下一冊連結 ── */
  function backPage(){
    var p=el('div','page back'),im=null;
    p.setAttribute('data-density','hard');
    if(D.back&&D.back.img){
      im=lazyImg(D.back.img,'免費索取《地藏菩薩本願經》紙本經書');p.appendChild(im);
    }else{
      var t=el('div','txt');p.className+=' plain';
      t.appendChild(el('h2','','免費索取《地藏菩薩本願經》'));
      t.appendChild(el('p','blurb','私訊我們「我要索取地藏經」，將免費寄送紙本經書給您。'));
      p.appendChild(t);
    }
    var r=el('div','rib');
    if(D.next_book){var a=el('a','p','下一冊 · '+D.next_book.name+'  ›');a.href='book'+D.next_book.no+'.html#'+D.next_book.n;r.appendChild(a)}
    else{var f=el('a','p','粉絲專頁 · 地藏菩薩經典導讀');f.href=FB;f.target='_blank';f.rel='noopener';r.appendChild(f)}
    var b=el('a','s','回首頁');b.href='index.html';r.appendChild(b);
    p.appendChild(r);
    return {p:p,img:im};
  }

  /* ── 組書:封面 → 目錄 → 每篇 14 頁(篇首+11 張漫畫+重點+預告)→ 封底 ── */
  add(coverPage(),{kind:'cover'});
  tocPages().forEach(function(p){add(p,{kind:'toc'})});
  D.posts.forEach(function(po){
    postStart[po.n]=pages.length;
    add(introPage(po),{post:po.n,kind:'intro'});
    po.images.forEach(function(src,i){
      var p=el('div','page'),im=lazyImg(src,'第 '+po.n+' 篇 第 '+(i+1)+' 張');
      p.appendChild(im);add(p,{img:im,post:po.n,kind:'img',no:i+1});
    });
    add(keyPage(po),{post:po.n,kind:'key'});
    var x=nextPage(po);
    add(x.p?x.p:x,{img:x.img||null,post:po.n,kind:po.next_n?'next':'end'});
  });
  if(pages.length%2===0)add(el('div','page blank'),{kind:'blank'});   // 保證總頁數為偶數,封底才會單獨在最後
  var bk=backPage();add(bk.p,{img:bk.img,kind:'back'});
  var total=pages.length;

  /* ── 文字太長時,自動把這一頁的字縮小到放得下 ── */
  function over(t){return t.scrollHeight>t.clientHeight+1||t.scrollWidth>t.clientWidth+1}
  function bsearch(t,prop,lo,hi){                        // 二分法:找放得下的最大比例
    for(var n=0;n<8;n++){var m=(lo+hi)/2;t.style.setProperty(prop,m.toFixed(4));if(over(t))hi=m;else lo=m}
    t.style.setProperty(prop,lo.toFixed(4));return lo;
  }
  function fit(){
    var ts=root.querySelectorAll('.txt');
    for(var j=0;j<ts.length;j++){
      var t=ts[j];if(!t.clientHeight)continue;           // 還沒顯示的頁不用量
      t.style.setProperty('--k',1);t.style.setProperty('--kq',1);var k=1,kq=1;
      if(over(t)){
        if(t.querySelector('.qcard')){                   // 重點頁:先縮金句(最多縮到 78%),不夠再整頁一起縮
          t.style.setProperty('--kq',.78);
          if(over(t)){kq=.78;k=bsearch(t,'--k',.45,1)}
          else{t.style.setProperty('--kq',1);kq=bsearch(t,'--kq',.78,1)}
        }else k=bsearch(t,'--k',.45,1);
      }
      t.setAttribute('data-k',k.toFixed(3));t.setAttribute('data-kq',kq.toFixed(3));
    }
  }
  var ft=0;function fitSoon(d){clearTimeout(ft);ft=setTimeout(fit,d==null?40:d)}
  function loadAll(){for(var k=0;k<total;k++){var im=imgs[k];if(im&&!im.getAttribute('src'))im.src=im.getAttribute('data-src')}}
  function loadAround(i){for(var k=Math.max(0,i-3);k<=Math.min(total-1,i+9);k++){var im=imgs[k];if(im&&!im.getAttribute('src'))im.src=im.getAttribute('data-src')}}
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fit,200)});
  if(document.fonts){if(document.fonts.ready)document.fonts.ready.then(function(){fitSoon(0)});document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',function(){fitSoon(20)})}

  /* ── 檢查用:?audit=篇號 / toc / all → 平鋪總覽 ── */
  if(AUDIT){
    var pick=[],i;
    for(i=0;i<total;i++){
      if(AUDIT==='toc'){if(kinds[i]==='cover'||kinds[i]==='toc'||kinds[i]==='back')pick.push(i)}
      else if(AUDIT==='all'){if(kinds[i]!=='img')pick.push(i)}
      else if(postOf[i]===parseInt(AUDIT,10)){if(!/t$/.test(AUDIT)||kinds[i]!=='img')pick.push(i)}   // 21 = 這一篇全部 14 頁;21t = 只看文字頁
    }
    document.body.className+=' audit';
    root.textContent='';
    var g=el('div','agrid');
    if(Q.size)g.style.setProperty('--ps',Q.size+'px');if(Q.cols)g.style.setProperty('--cols',Q.cols);
    pick.forEach(function(i){
      var f=el('figure'),c=el('figcaption','',i+' · '+kinds[i]+(kinds[i]==='img'?' '+imgNo[i]+'/11':'')+(postOf[i]?' · 第 '+postOf[i]+' 篇':''));
      f.appendChild(c);f.appendChild(pages[i]);g.appendChild(f);
      pages[i].setAttribute('data-idx',i);
      if(imgs[i])imgs[i].src=imgs[i].getAttribute('data-src');
    });
    root.appendChild(g);
    window.__book={D:D,pages:pages,kinds:kinds,imgNo:imgNo,postOf:postOf,postStart:postStart,total:total,fit:fit,audit:true};
    setTimeout(fit,50);setTimeout(fit,400);
    return;
  }

  /* ── 平常的翻頁模式 ── */
  var sel=document.getElementById('jump');
  D.posts.forEach(function(po){var o=document.createElement('option');o.value=po.n;o.textContent='第 '+po.n+' 篇 '+(po.title||'');sel.appendChild(o)});

  var KEY='shilun-book-'+D.no,start=0;
  var h=parseInt((location.hash||'').replace('#',''),10);
  var sv=0;try{sv=parseInt(localStorage.getItem(KEY),10)||0}catch(e){}
  if(h&&postStart[h]!=null){start=postStart[h];if(sv>0&&sv<total&&postOf[sv]===h)start=sv}
  else if(sv>0&&sv<total){start=sv}

  var pf=new St.PageFlip(root,{width:560,height:560,size:'stretch',minWidth:240,maxWidth:760,minHeight:240,maxHeight:760,
    showCover:true,usePortrait:true,mobileScrollSupport:false,maxShadowOpacity:.35,flippingTime:600,startPage:start});
  pf.loadFromHTML(pages);

  var ind=document.getElementById('ind'),prev=document.getElementById('prev'),next=document.getElementById('next');
  function name1(j){var k=kinds[j];return k==='intro'?'篇首':k==='img'?('圖 '+imgNo[j]):k==='key'?'重點':k==='next'?'預告':k==='end'?'圓滿':''}
  function label(i){
    if(kinds[i]==='cover')return '封面';
    if(kinds[i]==='back'||kinds[i]==='blank'&&i>=total-2)return '封底';
    if(kinds[i]==='toc')return '目錄';
    var n=postOf[i],s='第 '+n+' 篇 · ',a=name1(i),j=i+1;
    var two=false;try{two=pf.getOrientation()==='landscape'}catch(e){}
    if(two&&j<total&&postOf[j]===n&&kinds[j]!=='back'){
      var b=name1(j);
      if(kinds[i]==='img'&&kinds[j]==='img')return s+'圖 '+imgNo[i]+'–'+imgNo[j]+' / 11';
      return s+a+' + '+b;
    }
    return s+a+(kinds[i]==='img'?' / 11':'');
  }
  function upd(i){
    var n=postOf[i];
    ind.textContent=label(i);
    prev.disabled=i<=0;next.disabled=i>=total-1;
    if(n)sel.value=n;
    loadAround(i);
    try{localStorage.setItem(KEY,String(i))}catch(e){}
    if(n&&history.replaceState){try{history.replaceState(null,'','#'+n)}catch(e){}}
    fitSoon(60);
  }
  var pend=null;                                         // 翻頁動畫還沒結束就按了「跳到某篇」:先記著,動畫一結束再跳,免得書面錯位
  function busy(){try{return pf.getFlipController().state!=='read'}catch(e){return false}}
  function go(i){if(i==null)return;if(busy()){pend=i;return}pf.flip(i)}
  pf.on('flip',function(e){upd(e.data)});
  pf.on('changeState',function(e){
    if(e.data==='flipping'||e.data==='fold_corner')fit();
    if(e.data==='read'&&pend!=null){var j=pend;pend=null;setTimeout(function(){go(j)},30)}
  });
  prev.onclick=function(){pf.flipPrev()};next.onclick=function(){pf.flipNext()};
  sel.onchange=function(){go(postStart[sel.value])};
  tocBtns.forEach(function(b){b.onclick=function(){go(postStart[b.getAttribute('data-n')])}});
  document.addEventListener('keydown',function(e){if(e.target&&(e.target.tagName==='SELECT'))return;if(e.key==='ArrowLeft')pf.flipPrev();if(e.key==='ArrowRight')pf.flipNext()});
  window.addEventListener('hashchange',function(){var n=parseInt((location.hash||'').replace('#',''),10);if(n&&postStart[n]!=null)go(postStart[n])});
  window.__book={D:D,pf:pf,pages:pages,imgs:imgs,kinds:kinds,imgNo:imgNo,postOf:postOf,postStart:postStart,total:total,fit:fit,label:label};
  upd(start);
  setTimeout(fit,300);
})();

/* ───────── v4(2026-10-21)視窗自動適應 ─────────
   翻頁程式(StPageFlip)的 stretch 模式只認一個 maxWidth,也只用「視窗寬度 < 2×minWidth」決定單頁或雙頁,所以:
     ① 視窗很寬時,書最寬就停在 2×760,而且靠左;
     ② 手機橫放、半高視窗這種「寬而矮」的視窗,仍排成雙頁,頁面被壓得很小,或把按鈕蓋住;
     ③ 平板直放這種「窄而高」的視窗,排成雙頁後上下留一大片空白。
   這裡改成:每次視窗大小改變,依「書本可用區域」(#book 的寬、高)重新決定
     ‧ 單頁或雙頁:比較「兩頁並排」與「單頁」各自放得下的方形頁有多大,雙頁至少要有單頁的 72% 才用雙頁
     ‧ 頁面最大邊長放寬到 960px
   然後請翻頁程式重算,讀到哪一頁就停在哪一頁。萬一出任何狀況,就維持上面原本的行為,不影響閱讀。 */
(function(){
  try{
    var B=window.__book;if(!B||!B.pf||B.audit)return;
    var pf=B.pf,S=pf.getSettings(),bk=document.getElementById('book'),ind=document.getElementById('ind'),sel=document.getElementById('jump');
    var MAXP=960;
    S.maxWidth=MAXP;S.maxHeight=MAXP;bk.style.maxWidth=(2*MAXP)+'px';bk.style.minHeight='120px';
    var want=function(){var W=bk.clientWidth,H=bk.clientHeight;if(!W||!H)return null;
      var two=Math.min(W/2,H,MAXP),one=Math.min(W,H,MAXP);return two>=0.72*one?'landscape':'portrait'};
    var sync=function(){var i=pf.getCurrentPageIndex();try{ind.textContent=B.label(i)}catch(e){}
      var n=B.postOf[i];if(n&&sel)sel.value=n;
      for(var k=Math.max(0,i-3);k<=Math.min(B.total-1,i+9);k++){var im=B.imgs[k];if(im&&!im.getAttribute('src'))im.src=im.getAttribute('data-src')}};
    var apply=function(force){var m=want();if(!m)return;
      if(m==='portrait'){S.usePortrait=true;S.minWidth=1e6}else{S.usePortrait=false}
      if(force||pf.getOrientation()!==m){pf.update();sync()}};
    var raf=0;
    window.addEventListener('resize',function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){apply(false)})});
    window.addEventListener('orientationchange',function(){setTimeout(function(){apply(false)},250)});
    pf.on('changeOrientation',sync);
    apply(true);
  }catch(e){}
})();

/* ───────── v5(2026-10-21)回首頁按鈕 ─────────
   右上角原本只有一個 13px 的灰色小字「書櫃」,讀者看不出它是回首頁的按鈕。
   這裡把文字改成「回首頁」,外觀(有底色的膠囊按鈕 + 小房子圖示)寫在 book.css 檔尾。
   另外封底(backPage)原本的「回書櫃」也改叫「回首頁」,全站叫法一致。 */
(function(){
  try{
    var a=document.querySelector('header a[href="index.html"]');
    if(a){a.textContent='回首頁';a.title='回到首頁(書櫃)'}
  }catch(e){}
})();
