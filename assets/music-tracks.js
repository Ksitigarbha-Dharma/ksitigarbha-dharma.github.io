/* 背景音樂曲目清單(2026-10-22)。
   ‧ 要新增、移除或調整順序,只改這個檔;音檔(mp3)放在 audio/ 資料夾,用相對路徑。
   ‧ id:程式內部代號,不要重複(改了 id,訪客先前記住的選擇會重置)。 name:選單上的名稱。 note:名稱下面的小字。 src:音檔路徑。
   ‧ def:true = 第一次來的訪客預設播放的那一首(只放在一首上;都沒寫就播第一首)。 */
window.MUSIC_TRACKS=[
  {id:'ambient-1',name:'冥想氛圍 一',note:'緩慢、空靈 · 3:13',src:'audio/ambient-1.mp3'},
  {id:'ambient-2',name:'冥想氛圍 二',note:'緩慢、空靈 · 3:13',src:'audio/ambient-2.mp3',def:true},
  {id:'lofi-1',name:'Lo-fi 夜讀 一',note:'輕鬆鋼琴與鼓點 · 2:13',src:'audio/lofi-1.mp3'},
  {id:'lofi-2',name:'Lo-fi 夜讀 二',note:'輕鬆鋼琴與鼓點 · 2:22',src:'audio/lofi-2.mp3'},
  {id:'cinematic-1',name:'電影管弦 一',note:'合唱與管弦、莊嚴 · 3:19',src:'audio/cinematic-1.mp3'},
  {id:'cinematic-2',name:'電影管弦 二',note:'合唱與管弦、莊嚴 · 3:23',src:'audio/cinematic-2.mp3'},
  {id:'electro-1',name:'電子輕律動 一',note:'輕電子與手碟 · 3:32',src:'audio/electro-1.mp3'},
  {id:'electro-2',name:'電子輕律動 二',note:'輕電子與手碟 · 3:38',src:'audio/electro-2.mp3'}
];
