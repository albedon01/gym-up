/* Gym Up - Kalori bölümü (ayrı dosya). app.js'deki ortak şeyleri kullanır (S, save, render, today, pd, ymd, fdl, esc...).
   Çalışma şekli: yemek fotoğrafını Claude'a atarsın, o satır satır cevap verir, sen satırları buraya yapıştırırsın.
   Uygulama günlük durumu hesaplar ve ne yapman gerektiğini söyler. */
(function(){
var MEALS=[["b","Kahvaltı","🌅"],["l","Öğle yemeği","🍲"],["d","Akşam yemeği","🌙"],["s","Atıştırmalık","🍎"]];
var GD=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
var K={fb:"",meal:(function(){var h=new Date().getHours();return h<11?"b":h<16?"l":h<21?"d":"s"})(),add:null,msg:"",date:null,paste:""};
var TEMPLATE="Bu fotoğraftaki yemekleri analiz et. Her yemek için TEK satır yaz, tam şu biçimde:\nÖğün | Yemek | gram | kcal | protein | karbonhidrat | yağ\nÖğün şunlardan biri olsun: Kahvaltı, Öğle, Akşam, Atıştırmalık.\nkcal için gerçekçi bir aralık yaz (örn. 400-550). protein, karbonhidrat ve yağ gram olarak tek sayı olsun.\nSatırlardan başka bir şey yazma, sadece en sonda belirsizlikleri bir cümleyle söyle.";

function cal(){var c=S.cal||(S.cal={});if(!c.prof)c.prof={sex:"m",act:1.55,goal:"keep"};if(!c.days)c.days={};if(!c.water)c.water={};return c}
function num(v){return parseFloat(String(v==null?"":v).replace(",","."))}
function pn(s){var m=String(s==null?"":s).replace(",",".").match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):0}
function opt(v,l,c){return'<option value="'+v+'"'+(String(c)===String(v)?" selected":"")+'>'+l+'</option>'}
function dshift(d,n){var x=pd(d);x.setDate(x.getDate()+n);return ymd(x)}
function kd(){initStart();var t=today();if(!K.date||K.date>t||K.date<S.start)K.date=t;return K.date}
function dlabel(d){var t=today();return d===t?"Bugün":d===dshift(t,-1)?"Dün":""}
function lit(ml){return (Math.round(ml/10)/100).toString().replace(".",",")}

/* ---------- hedef hesabı ---------- */
function tgt(P){
 var w=num(P.w),h=num(P.h),a=num(P.a);
 if(!(w>0&&h>0&&a>0))return null;
 if(a<18)return{minor:1};
 var b=10*w+6.25*h-5*a+(P.sex==="f"?-161:5),td=b*(+P.act||1.55),fl=P.sex==="f"?1200:1500;
 return{bmr:Math.round(b),keep:Math.round(td),lose:Math.round(Math.min(td,Math.max(fl,td-Math.min(500,td*.2)))),gain:Math.round(td+Math.max(250,Math.min(500,td*.1))),prot:Math.round(w*1.8)}}
function tgHtml(){
 var P=cal().prof,T=tgt(P);
 if(!T)return'<p class="sub" style="margin:10px 0 0">Boy, kilo ve yaşını yaz, hedeflerin burada çıksın.</p>';
 if(T.minor)return'<p class="sub" style="margin:10px 0 0">18 yaş altı için bu hesap uygun değil, doktoruna ya da diyetisyene danış.</p>';
 var g=[["keep","Kilo koru"],["lose","Kilo ver"],["gain","Kilo al"]];
 return'<div class="row" style="margin-top:10px">'+g.map(function(x){return'<button class="b'+(P.goal===x[0]?' p':'')+'" data-kgoal="'+x[0]+'" style="flex:1;line-height:1.3">'+x[1]+'<br><b style="font-size:17px">'+T[x[0]]+'</b> kcal</button>'}).join("")+'</div><p class="sub" style="margin:8px 0 0">Bazal metabolizma: '+T.bmr+' kcal · Protein hedefi: yaklaşık '+T.prot+' g/gün. Genel bir tahmindir (Mifflin-St Jeor). Sağlık sorunun varsa doktora ya da diyetisyene danış.</p>'}

/* ---------- günlük durum ve öneriler ---------- */
function advice(o){
 var a=[];
 if(!o.ok){a.push("Önce aşağıdan boy, kilo ve yaşını gir, hedeflerini hesaplayayım.");return a}
 if(o.eat===0)a.push(o.today?"Henüz bir şey eklemedin. Yemek fotoğraflarını Claude'a atıp gelen satırları aşağıya yapıştır.":"Bu güne kayıt eklenmemiş.");
 else if(o.goal==="gain")a.push(o.left>0?"Hedefe ulaşmak için "+o.left+" kcal daha yemelisin.":"Kalori hedefine ulaştın ✓");
 else a.push(o.left>=0?"Günlük üst sınıra "+o.left+" kcal kaldı.":"Hedefi "+(-o.left)+" kcal aştın. Bir sonraki öğünü hafif tut, tek günlük fazla ilerlemeyi bozmaz.");
 var pl=o.M.p-o.sp;
 if(o.eat>0){if(pl>10)a.push("Protein hedefine "+pl+" g kaldı. Örnek: 150 g tavuk göğsü yaklaşık 45 g, 1 kase yoğurt yaklaşık 10 g, 3 yumurta yaklaşık 18 g.");else a.push("Protein hedefini yakaladın ✓")}
 if(o.eat>0&&o.training&&o.sc<o.M.c*.6)a.push("Antrenman günü ve karbonhidrat düşük kalmış. Antrenman öncesi ya da sonrası pirinç, makarna, yulaf veya muz iyi gider.");
 if(o.sf>o.M.f*1.2)a.push("Yağ hedefin üstünde. Sıvı yağ, kuruyemiş ve soslara dikkat et.");
 if(o.goal==="lose")a.push("Kilo vermek için tokluk sağlayan protein ve sebze ağırlıklı seç.");
 if(o.goal==="gain"&&o.eat>0&&o.left>300)a.push("Hedefin altında kalırsan arada kalorili atıştırma ekle: fıstık ezmesi, süt, muz.");
 return a}
function summary(d,o,L){
 var txt="Bugünkü durumum ("+fdl(d)+"):\n";
 txt+=o.ok?("Hedef: "+o.gn+" "+o.tg+" kcal, protein "+o.M.p+" g, karbonhidrat "+o.M.c+" g, yağ "+o.M.f+" g.\n"):"Hedefim henüz hesaplanmadı.\n";
 txt+="Yediğim: "+o.eat+" kcal, protein "+o.sp+" g, karbonhidrat "+o.sc+" g, yağ "+o.sf+" g.\n";
 MEALS.forEach(function(m){var it=L.filter(function(x){return(x.m||"s")===m[0]});if(it.length)txt+=m[1]+": "+it.map(function(x){return x.n+" ("+x.k+" kcal)"}).join(", ")+"\n"});
 txt+="Antrenman günü: "+(o.training?"evet":"hayır")+".\nGünün kalan öğünleri için ne yememi önerirsin?";
 return txt}

/* ---------- yapıştırılan satırları okuma ---------- */
function mealId(s){s=String(s||"").toLowerCase().trim();if(/^kahvalt/.test(s))return"b";if(/^(öğle|ogle|öğlen)/.test(s))return"l";if(/^(akşam|aksam)/.test(s))return"d";if(/^(atıştır|atistir|ara öğün|ara ogun|ara)$/.test(s)||/^atıştırmalık|^atistirmalik/.test(s))return"s";return null}
function parseLines(txt,defM){
 var out=[],bad=0;
 String(txt).split(/\r?\n/).forEach(function(line){
  line=line.trim();if(!line)return;
  var p=line.split(/\s*[|\t;]\s*/).map(function(x){return x.trim()});
  while(p.length&&p[0]==="")p.shift();
  while(p.length&&p[p.length-1]==="")p.pop();
  if(p.length<2||/^[-:\s]+$/.test(p.join("")))return;
  var m=mealId(p[0]);
  if(m&&p.length>=3)p.shift();else m=defM;
  var name=p[0],g=0,kc,pp=0,cc=0,ff=0;
  if(p.length>=6){g=pn(p[1]);kc=p[2];pp=pn(p[3]);cc=pn(p[4]);ff=pn(p[5])}
  else if(p.length===5){kc=p[1];pp=pn(p[2]);cc=pn(p[3]);ff=pn(p[4])}
  else kc=p[1];
  var r=String(kc).match(/(\d+)\s*[-–—]\s*(\d+)/),k=r?Math.round((+r[1]+ +r[2])/2):Math.round(pn(kc));
  if(!name||!(k>0)){if(!/kcal|kalori/i.test(line))bad++;return}
  var it={n:name,k:k,g:Math.round(g)||0,p:Math.round(pp),c:Math.round(cc),f:Math.round(ff),m:m};
  if(r){it.kmin=+r[1];it.kmax=+r[2]}
  out.push(it)});
 return{items:out,bad:bad}}

/* ---------- görünüm parçaları ---------- */
function ring(eat,tg,over){var C=326.7,pc=tg?Math.min(1,eat/tg):0;return'<svg viewBox="0 0 120 120" width="124" height="124" style="flex:none"><defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#ffb347"/></linearGradient></defs><circle cx="60" cy="60" r="52" fill="none" stroke="var(--bd)" stroke-width="10"/><circle cx="60" cy="60" r="52" fill="none" stroke="'+(over?"#ff5a5a":"url(#kg)")+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(C*pc).toFixed(1)+' '+C+'" transform="rotate(-90 60 60)"/><text x="60" y="60" text-anchor="middle" font-size="26" font-weight="700" fill="var(--tx)">'+eat+'</text><text x="60" y="78" text-anchor="middle" font-size="11" fill="var(--mu)">'+(tg?'/ '+tg+' kcal':'kcal')+'</text></svg>'}
function mrow(l,v,t,col){var pc=t?Math.min(100,Math.round(v/t*100)):0;return'<div style="margin:7px 0"><div class="row" style="justify-content:space-between;font-size:12px"><span>'+l+'</span><span style="color:var(--mu)">'+v+(t?' / '+t:'')+' g</span></div><div class="bar" style="margin-top:3px;height:6px"><i style="width:'+pc+'%;background:'+col+'"></i></div></div>'}
function entry(y){var x=y[0],i=y[1],rg=x.kmin!=null&&x.kmin!==x.kmax;return'<div class="row" style="padding:8px 0;border-top:1px solid var(--bd);margin-top:8px"><div style="flex:1;min-width:0"><div>'+esc(x.n)+'</div>'+(rg||x.p||x.c||x.f||x.g?'<div class="sub" style="margin:0">'+(x.g?x.g+' g · ':'')+(rg?'aralık '+x.kmin+'–'+x.kmax+' kcal':'')+(x.p||x.c||x.f?(rg?' · ':'')+'P '+x.p+' K '+x.c+' Y '+x.f+' g':'')+'</div>':'')+'</div><b>'+x.k+'</b><button class="b" data-kdel="'+i+'" style="padding:4px 10px">×</button></div>'}
function mealCard(m,L){
 var it=[];L.forEach(function(x,i){if((x.m||"s")===m[0])it.push([x,i])});
 var sub=it.reduce(function(s,y){return s+(+y[0].k||0)},0),open=K.add===m[0];
 var h='<div class="card"><div class="row" style="justify-content:space-between"><h2>'+m[2]+' '+m[1]+'</h2><div class="row"><b>'+(sub?sub+' kcal':'')+'</b><button class="b'+(open?'':' p')+'" data-kadd="'+m[0]+'" style="padding:6px 10px;font-size:13px">'+(open?'×':(m[0]==="s"?'+ Atıştırmalık ekle':'+ Ekle'))+'</button></div></div>';
 if(open)h+='<div style="margin-top:10px"><input id="kan" placeholder="Yemek adı"><div class="row" style="margin-top:8px"><input id="kak" inputmode="numeric" placeholder="kcal"><input id="kap" inputmode="numeric" placeholder="P g"><input id="kac" inputmode="numeric" placeholder="K g"><input id="kaf" inputmode="numeric" placeholder="Y g"></div><button class="b p" data-kaddok="1" style="width:100%;margin-top:8px">Ekle</button></div>';
 h+=it.map(entry).join("");
 if(!it.length&&!open)h+='<p class="sub" style="margin:6px 0 0">Henüz bir şey yok.</p>';
 return h+'</div>'}

function kal(){
 var C=cal(),P=C.prof,d=kd(),L=C.days[d]||[],T=tgt(P),ok=!!(T&&!T.minor),goal=P.goal||"keep",tg=ok?T[goal]:0,t=today();
 var eat=0,sp=0,sc=0,sf=0,lo=0,hi=0;
 L.forEach(function(x){eat+=+x.k||0;sp+=+x.p||0;sc+=+x.c||0;sf+=+x.f||0;lo+=x.kmin!=null?x.kmin:(+x.k||0);hi+=x.kmax!=null?x.kmax:(+x.k||0)});
 var left=tg-eat,M={p:0,c:0,f:0},GN={keep:"Kilo koru",lose:"Kilo ver",gain:"Kilo al"};
 if(ok){var fat=Math.round(tg*.25/9);M={p:T.prot,f:fat,c:Math.max(0,Math.round((tg-T.prot*4-fat*9)/4))}}
 var ts=S.slots.find(function(s){return s.dow===pd(d).getDay()}),training=!!(ts&&ts.ex.length);
 var o={ok:ok,eat:eat,sp:sp,sc:sc,sf:sf,left:left,M:M,goal:goal,tg:tg,gn:GN[goal],training:training,today:d===t};
 /* gün şeridi */
 var days=[],from=dshift(t,-13);if(from<S.start)from=S.start;
 for(var x=t;x>=from;x=dshift(x,-1))days.push(x);
 var h='<div style="display:flex;flex-direction:row-reverse;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:6px">'+days.map(function(x){return'<button class="tab'+(x===d?' on':'')+'" data-kday="'+x+'" style="flex:none;min-width:58px;padding:8px 6px"><div style="font-size:11px;opacity:.8">'+GD[pd(x).getDay()]+'</div><b>'+pd(x).getDate()+' '+AY[pd(x).getMonth()]+'</b></button>'}).join("")+'</div>';
 h+='<p class="sub" style="margin:6px 2px 8px">'+(dlabel(d)?dlabel(d)+' · ':'')+fdl(d)+'</p>';
 h+='<div class="card"><div class="row" style="gap:12px">'+ring(eat,tg,ok&&goal!=="gain"&&left<0)+'<div style="flex:1;min-width:0">'+mrow("Protein",sp,M.p,"var(--ok)")+mrow("Karbonhidrat",sc,M.c,"#ffb347")+mrow("Yağ",sf,M.f,"#6ea8ff")+'</div></div>';
 h+='<p class="sub" style="margin:8px 0 0">'+(ok?'Hedef: '+GN[goal]+' · ':'')+(lo!==hi?'Tahmini aralık: '+lo+'–'+hi+' kcal':'Makrolar yapıştırılan satırlardan gelir.')+'</p>';
 h+='<div style="margin-top:10px;border-top:1px solid var(--bd);padding-top:8px"><b>Bugün ne yapmalı?</b>'+advice(o).map(function(s){return'<p style="margin:6px 0 0;font-size:14px">• '+esc(s)+'</p>'}).join("")+'</div>';
 h+='<button class="b" data-kcs="1" style="width:100%;margin-top:10px">Günün özetini kopyala (Claude\'a sormak için)</button>'+(K.msg?'<div class="msg">'+esc(K.msg)+'</div>':'')+(K.fb?'<textarea readonly style="margin-top:6px">'+esc(K.fb)+'</textarea>':'')+'</div>';
 MEALS.forEach(function(m){h+=mealCard(m,L)});
 /* Claude'dan yapıştır */
 h+='<div class="card"><h2>Claude\'dan gelen satırları yapıştır</h2><p class="sub" style="margin:2px 0 8px">Yemek fotoğrafını Claude\'a at, önce şablonu yapıştır. Gelen satırları aşağıya koy. Satırda öğün yazmıyorsa seçili öğüne eklenir.</p><div class="row" style="gap:6px">'+MEALS.map(function(m){return'<button class="b'+(K.meal===m[0]?' p':'')+'" data-km="'+m[0]+'" style="flex:1;padding:8px 2px;font-size:12px;line-height:1.3">'+m[2]+'<br>'+m[1].split(" ")[0]+'</button>'}).join("")+'</div><textarea id="kpt" style="margin-top:8px" placeholder="Öğle | Tavuk göğsü ızgara | 150 | 220-280 | 45 | 0 | 5">'+esc(K.paste)+'</textarea><div class="row" style="margin-top:8px"><button class="b" data-kct="1">Şablonu kopyala</button><button class="b p" data-kimp="1" style="flex:1">Satırları ekle</button></div></div>';
 /* su (isteğe bağlı) */
 var w=num(P.w);
 if(C.showWater){
  var wm=C.water[d]||0,wt=(w>0?Math.round(w*35/50)*50:2500)+(training?500:0);
  h+='<div class="card"><div class="row" style="justify-content:space-between"><h2>💧 Su</h2><b>'+lit(wm)+' / '+lit(wt)+' L</b></div><div class="bar"><i style="width:'+Math.min(100,Math.round(wm/wt*100))+'%;background:linear-gradient(90deg,#4dabf7,#a5d8ff)"></i></div><p class="sub" style="margin:6px 0 0">'+(w>0?'Kilo × 35 ml'+(training?' + antrenman günü için 500 ml':''):'Kilonu girersen sana göre hesaplarım.')+'</p><div class="row" style="margin-top:10px"><button class="b" data-kw="-250" style="flex:1">− 250 ml</button><button class="b p" data-kw="250" style="flex:2">+ 250 ml</button></div></div>'}
 /* son 7 gün */
 var ds=[],f7=dshift(t,-6);if(f7<S.start)f7=S.start;for(var y=f7;y<=t;y=dshift(y,1))ds.push(y);
 var vals=ds.map(function(z){return(C.days[z]||[]).reduce(function(s,q){return s+(+q.k||0)},0)}),mx=Math.max(tg||0,Math.max.apply(null,vals),1),fl=vals.filter(function(v){return v>0}),avg=fl.length?Math.round(fl.reduce(function(a,b){return a+b},0)/fl.length):0,H=84;
 h+='<div class="card"><div class="row" style="justify-content:space-between"><h2>Son günler</h2><span class="sub" style="margin:0">'+(avg?'Ortalama '+avg+' kcal':'')+'</span></div><div style="position:relative;display:flex;align-items:flex-end;gap:6px;height:'+(H+16)+'px;margin-top:10px">'+(tg?'<div style="position:absolute;left:0;right:0;bottom:'+Math.round(tg/mx*H)+'px;border-top:1px dashed var(--mu);opacity:.6"></div>':'')+ds.map(function(z,i){var v=vals[i];return'<div data-kday="'+z+'" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;cursor:pointer"><div data-kday="'+z+'" style="font-size:10px;color:var(--mu)">'+(v||"")+'</div><div data-kday="'+z+'" style="width:100%;height:'+Math.max(v?4:2,Math.round(v/mx*H))+'px;border-radius:6px 6px 2px 2px;background:'+(z===d?'linear-gradient(180deg,#ffb347,#ff6a3d)':'var(--bd)')+'"></div></div>'}).join("")+'</div><div style="display:flex;gap:6px;margin-top:4px">'+ds.map(function(z){return'<div data-kday="'+z+'" style="flex:1;text-align:center;font-size:11px;color:var(--mu);cursor:pointer">'+GD[pd(z).getDay()]+'</div>'}).join("")+'</div></div>';
 /* profil */
 h+='<div class="card"><h2>Bilgilerim ve hedeflerim</h2><div class="row" style="margin-top:8px"><input data-kp="h" inputmode="numeric" placeholder="Boy (cm)" value="'+esc(P.h)+'"><input data-kp="w" inputmode="decimal" placeholder="Kilo (kg)" value="'+esc(P.w)+'"><input data-kp="a" inputmode="numeric" placeholder="Yaş" value="'+esc(P.a)+'"></div><div class="row" style="margin-top:8px"><select data-kp="sex">'+opt("m","Erkek",P.sex)+opt("f","Kadın",P.sex)+'</select><select data-kp="act">'+opt(1.2,"Hareketsiz",P.act)+opt(1.375,"Hafif aktif (1-3 gün)",P.act)+opt(1.55,"Orta aktif (3-5 gün)",P.act)+opt(1.725,"Çok aktif (6-7 gün)",P.act)+'</select></div><div id="ktg">'+tgHtml()+'</div><label class="row" style="margin-top:12px;gap:10px"><input type="checkbox" data-kwt="1"'+(C.showWater?' checked':'')+'><span>Günlük su hedefini göster</span></label></div>';
 return h}

/* ---------- olaylar ---------- */
function copy(txt,okmsg){
 function fb(){var t=document.createElement("textarea");t.value=txt;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}document.body.removeChild(t);K.msg=ok?okmsg:"Otomatik kopyalanamadı. Aşağıdaki metni seçip kopyala.";K.fb=ok?"":txt;render()}
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){K.msg=okmsg;render()},fb);return}}catch(e){}
 fb()}
function curSummary(){
 var C=cal(),d=kd(),L=C.days[d]||[],T=tgt(C.prof),ok=!!(T&&!T.minor),goal=C.prof.goal||"keep",tg=ok?T[goal]:0,eat=0,sp=0,sc=0,sf=0;
 L.forEach(function(x){eat+=+x.k||0;sp+=+x.p||0;sc+=+x.c||0;sf+=+x.f||0});
 var M={p:0,c:0,f:0};if(ok){var fat=Math.round(tg*.25/9);M={p:T.prot,f:fat,c:Math.max(0,Math.round((tg-T.prot*4-fat*9)/4))}}
 var ts=S.slots.find(function(s){return s.dow===pd(d).getDay()});
 return summary(d,{ok:ok,eat:eat,sp:sp,sc:sc,sf:sf,M:M,tg:tg,gn:{keep:"Kilo koru",lose:"Kilo ver",gain:"Kilo al"}[goal],training:!!(ts&&ts.ex.length)},L)}
app.addEventListener("click",function(e){
 var d0=e.target.dataset,dd=e.target.closest?e.target.closest("[data-kday]"):null,C=cal(),d=kd();
 if(!(d0.kct||d0.kcs||d0.kimp)){K.msg="";K.fb=""}
 if(d0.kgoal){C.prof.goal=d0.kgoal;save();render()}
 else if(dd){K.date=dd.dataset.kday;K.add=null;render()}
 else if(d0.km){K.meal=d0.km;K.paste=(document.getElementById("kpt")||{}).value||"";render()}
 else if(d0.kw){C.water[d]=Math.max(0,(C.water[d]||0)+(+d0.kw));save();render()}
 else if(d0.kdel!=null){(C.days[d]||[]).splice(+d0.kdel,1);save();render()}
 else if(d0.kadd){K.add=K.add===d0.kadd?null:d0.kadd;render()}
 else if(d0.kaddok){var n=document.getElementById("kan").value.trim(),k=parseInt(document.getElementById("kak").value);if(n&&k>=0){var l=C.days[d]||(C.days[d]=[]);l.push({n:n,k:k,p:parseInt(document.getElementById("kap").value)||0,c:parseInt(document.getElementById("kac").value)||0,f:parseInt(document.getElementById("kaf").value)||0,m:K.add});K.add=null;save();render()}}
 else if(d0.kct)copy(TEMPLATE,"Şablon kopyalandı. Fotoğrafla birlikte Claude'a yapıştır.");
 else if(d0.kcs)copy(curSummary(),"Özet kopyalandı. Claude'a yapıştır.");
 else if(d0.kimp){
  var ta=(document.getElementById("kpt")||{}).value||"",r=parseLines(ta,K.meal);
  if(!r.items.length){K.paste=ta;K.msg="Satır bulunamadı. Biçim: Öğün | Yemek | gram | kcal | protein | karbonhidrat | yağ"}
  else{var l2=C.days[d]||(C.days[d]=[]);r.items.forEach(function(x){l2.push(x)});save();K.paste="";K.msg=r.items.length+" yemek eklendi"+(r.bad?" ("+r.bad+" satır okunamadı)":"")+"."}
  render()}
});
function kin(e){
 var t=e.target,dt=t.dataset;
 if(dt.kp){var P=cal().prof;P[dt.kp]=dt.kp==="act"?+t.value:t.value;save();var g=document.getElementById("ktg");if(g)g.innerHTML=tgHtml()}
 else if(dt.kwt&&e.type==="change"){cal().showWater=t.checked;save();render()}}
app.addEventListener("input",kin);app.addEventListener("change",kin);

MODS.push({id:"k",title:"🍽 Kalori"});
EXTRA.k=kal;
render();
})();
