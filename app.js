/* Gym Up - uygulama kodu. Bölümler: veri/ayarlar, hafta ve gün, antrenman ekranı, program düzenleme, yedek, sayaç, dinlenme ekranı. */
var KEY="gymtakip_v1";
function ex(n,s,r){return{name:n,sets:s,reps:r}}
var A=[ex("Chest Press",3,15),ex("Pec Fly Machine",3,15),ex("Lat Pulldown",3,15),ex("Seated Cable Row",3,15),ex("Triceps Pushdown",3,15),ex("Cable Biceps Curl",3,15)];
var B=[ex("Shoulder Press Machine",3,15),ex("Dumbbell Lateral Raise",3,15),ex("Leg Extension",3,10),ex("Leg Curl",3,10),ex("Leg Press",3,15),ex("Dumbbell Seated Calf Raise",3,15)];
var CAR={what:"Eğimli yürüyüş (eğim 10, hız 3→6)",min:30};
function defState(){return{slots:[
{id:"s1",label:"Salı",dow:2,ex:JSON.parse(JSON.stringify(A)),cardio:{...CAR}},
{id:"s2",label:"Çarşamba",dow:3,ex:JSON.parse(JSON.stringify(B)),cardio:{...CAR}},
{id:"s3",label:"Cuma",dow:5,ex:JSON.parse(JSON.stringify(A)),cardio:{...CAR}},
{id:"s4",label:"Cumartesi",dow:6,ex:JSON.parse(JSON.stringify(B)),cardio:{...CAR}}],logs:{}}}
var S;
try{S=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){S=null}
if(!S||!S.slots)S=defState();
(function(){var have={};S.slots.forEach(function(s){have[s.dow]=1});[[1,"Pazartesi","s5"],[4,"Perşembe","s6"],[0,"Pazar","s7"]].forEach(function(a){if(!have[a[0]])S.slots.push({id:a[2],label:a[1],dow:a[0],ex:[],cardio:{what:CAR.what,min:CAR.min}})});if(!S.fr){S.slots.forEach(function(s){if(s.dow===3||s.dow===6){if(!s.ex.some(function(x){return /front raise/i.test(x.name)})){var i=-1;s.ex.forEach(function(x,k){if(/lateral raise/i.test(x.name))i=k});s.ex.splice(i>=0?i+1:s.ex.length,0,{name:"Dumbbell Front Raise",sets:3,reps:15})}}});S.fr=1}
if(!S.ren){var RN={"biceps curl machine":"Cable Biceps Curl","calf raise machine":"Dumbbell Seated Calf Raise"};S.slots.forEach(function(s){s.ex.forEach(function(x){var n=RN[x.name.toLowerCase()];if(n)x.name=n})});Object.keys(S.logs).forEach(function(k){var e=S.logs[k].ex||{};Object.keys(RN).forEach(function(o){Object.keys(e).forEach(function(en){if(en.toLowerCase()===o){e[RN[o]]=e[en];delete e[en]}})})});S.ren=1}
S.slots.sort(function(x,y){return (x.dow+6)%7-(y.dow+6)%7});try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}})();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
var dow=new Date().getDay();
var cur=(S.slots.find(function(s){return s.dow===dow})||S.slots[0]).id;
var date=today(),view="w",msg="";
function slot(){return S.slots.find(function(s){return s.id===cur})||S.slots[0]}
function lg(){var k=date+"|"+cur;if(!S.logs[k])S.logs[k]={ex:{},cardio:{}};return S.logs[k]}
function last(name){
 var ks=Object.keys(S.logs).filter(function(k){return k.split("|")[0]<date&&S.logs[k].ex[name]&&S.logs[k].ex[name].some(function(x){return x&&x.kg})}).sort();
 if(!ks.length)return null;var k=ks[ks.length-1];return{d:k.split("|")[0],sets:S.logs[k].ex[name]}}
function fd(d){var p=d.split("-");return p[2]+"."+p[1]}
function lastCardio(){
 var ks=Object.keys(S.logs).filter(function(k){return k.split("|")[0]<date&&S.logs[k].cardio&&S.logs[k].cardio.min}).sort();
 return ks.length?S.logs[ks[ks.length-1]].cardio:null}
function render(){initStart();if(wk>curWk())wk=curWk();date=slotDate();
 var h=modeBar()+(view==="w"?weekBar():"")+'<div class="tabs"'+(EXTRA[view]?' style="display:none"':'')+'>'+S.slots.map(function(s){return'<button class="tab'+(s.id===cur&&view==="w"?" on":"")+'" data-t="'+s.id+'">'+esc(s.label)+(s.ex.length?'':'<div style="font-size:10px;opacity:.6;font-weight:400">dinlenme</div>')+'</button>'}).join("")+'</div>';
 if(view==="w")h+=work();else if(view==="p")h+=prog();else if(view==="g")h+=gifPage();else if(EXTRA[view])h+=EXTRA[view]();else h+=back();
 h+=EXTRA[view]?'<div class="foot"><button class="b" data-v="b">Yedek</button></div>':'<div class="foot"><button class="b" data-v="w">Antrenman</button><button class="b" data-v="p">Program düzenle</button><button class="b" data-v="g">🎞 GIF\'ler</button><button class="b" data-v="b">Yedek</button><button class="b" data-restset="1">⏱ Dinlenme: '+fmt(restDur)+'</button></div>';
 document.getElementById("app").innerHTML=h;
 var sw0=document.getElementById("sw");if(sw0)sw0.style.display=EXTRA[view]?"none":"flex";
 Array.prototype.forEach.call(document.querySelectorAll("img[data-g]"),function(i){i.src=IMG[i.dataset.g]});
}
function work(){
 var s=slot(),L=lg();
 var tot=0,dn=0;s.ex.forEach(function(e){tot+=e.sets;(L.ex[e.name]||[]).forEach(function(v,i){if(v&&v.done&&i<e.sets)dn++})});
 var h='<div class="card" style="margin-top:10px"><div class="row" style="justify-content:space-between"><div><b style="font-size:18px">'+esc(s.label)+'</b><div class="sub" style="margin:0">'+fdl(date)+'</div></div>'+(tot?'<div id="pgt" style="font-weight:700">'+dn+' / '+tot+' set</div>':'')+'</div>'+(tot?'<div class="bar"><i id="pgb" style="width:'+Math.round(dn/tot*100)+'%"></i></div>':'')+'</div>';
 s.ex.forEach(function(e,ei){
  var prev=last(e.name),arr=L.ex[e.name]||[];
  h+='<div class="card"><div class="row" style="justify-content:space-between"><h2>'+esc(e.name)+'</h2><button class="b" data-rm="'+ei+'" style="padding:4px 10px">'+(RM.k===s.id+"|"+ei?"Sil?":"×")+'</button></div><p class="sub">Hedef: '+e.sets+' set × '+e.reps+' tekrar'+(prev?' · Geçen ('+fd(prev.d)+'): '+prev.sets.filter(Boolean).map(function(x){return(x.kg||"-")+"×"+(x.reps||"-")}).join(" · "):"")+'</p>';
  h+=demoHtml(e.name,ei);h+='<div class="hd"><span></span><span class="lbl">Kilo (kg)</span><span class="lbl">Tekrar</span><span class="lbl"></span></div>';
  for(var i=0;i<e.sets;i++){
   var v=arr[i]||{},pk=prev&&prev.sets[i]?prev.sets[i].kg:"";
   h+='<div class="set'+(v.done?" dn":"")+'"><b>'+(i+1)+'</b><input inputmode="decimal" placeholder="'+esc(pk||"kg")+'" value="'+esc(v.kg)+'" data-e="'+ei+'" data-i="'+i+'" data-f="kg"><input inputmode="numeric" placeholder="'+e.reps+'" value="'+esc(v.reps)+'" data-e="'+ei+'" data-i="'+i+'" data-f="reps"><input type="checkbox" '+(v.done?"checked":"")+' data-e="'+ei+'" data-i="'+i+'" data-f="done"></div>';
  }
  h+='</div>';
 });
 if(!s.ex.length&&!ADD.open)h+='<div class="card" style="text-align:center"><h2>Dinlenme günü 😴</h2><p class="sub" style="margin:0">İstersen bu güne hareket ekleyebilirsin.</p></div>';h+=addHtml(s);if(!s.ex.length)return h;
 h+=cardioHtml(L,lastSegs())+'<div class="card" id="burnc"><h2>🔥 Tahmini kalori yakımı</h2><div class="row" style="margin:8px 0"><input data-bw="1" inputmode="decimal" placeholder="Kilon (kg)" value="'+esc((S.cal&&S.cal.prof&&S.cal.prof.w)||"")+'" style="max-width:140px"><span class="sub" style="margin:0">hesap için gerekli</span></div><div id="burn">'+burnHtml(s,L)+'</div></div>';
 return h;
}
var wk=(function(){initStart();return curWk()})();
var AY=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
function pd(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2],12)}
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function mon(d){var x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function initStart(){var t=today();if(!S.start||S.start>t){S.start=t;save()}}
function weekMon(){var m=pd(S.start);m.setDate(m.getDate()+wk*7);return m}
function weekNo(){return wk+1}
function slotDate(){var m=weekMon();m.setDate(m.getDate()+((slot().dow-m.getDay()+7)%7));return ymd(m)}
function fdl(d){var x=pd(d);return x.getDate()+" "+AY[x.getMonth()]+" "+x.getFullYear()}
function curWk(){initStart();return Math.max(0,Math.floor(Math.round((pd(today())-pd(S.start))/864e5)/7))}
function weekSel(){var o="",n=curWk();for(var i=0;i<=n;i++){var a=pd(S.start);a.setDate(a.getDate()+i*7);o+='<option value="'+i+'"'+(i===wk?" selected":"")+'>Hafta '+(i+1)+' · '+a.getDate()+' '+AY[a.getMonth()]+'</option>'}return '<select id="wsel" style="width:auto;font-weight:600">'+o+'</select>'}
/* --- YENİ BÖLÜM EKLEMEK İÇİN: MODS'a bir satır (id, başlık) ve EXTRA'ya aynı id ile bir fonksiyon ekle.
   Birden fazla bölüm olunca üstte geçiş çubuğu kendiliğinden çıkar. --- */
var bkFrom="w",MODS=[{id:"w",title:"🏋 Antrenman"}],EXTRA={};
function modeBar(){if(MODS.length<2)return"";return'<div class="seg">'+MODS.map(function(m){var on=view===m.id||((view==="p"||view==="b"||view==="g")&&m.id===(view==="b"?bkFrom:"w"));return'<button data-v="'+m.id+'" class="'+(on?"on":"")+'">'+m.title+'</button>'}).join("")+'</div>'}
function weekBar(){
 var a=weekMon(),b=new Date(a);b.setDate(b.getDate()+6);
 var r=a.getDate()+" "+AY[a.getMonth()]+" – "+b.getDate()+" "+AY[b.getMonth()];
 var n=weekNo();
 return '<div class="card" style="display:flex;align-items:center;gap:8px;margin-top:0"><button class="b" data-wk="-1" '+(n<=1?"disabled":"")+'>◀</button><div style="flex:1;text-align:center">'+weekSel()+'<div class="sub" style="margin:2px 0 0">'+r+(wk===curWk()?' \u00b7 bu hafta':'')+'</div></div><button class="b" data-wk="1" '+(wk>=curWk()?"disabled":"")+'>▶</button></div>'}
var ADD={open:false,msg:""},RM={};
var CAT=A.concat(B).map(function(x){return x.name});
function allNames(){var seen={},out=[];CAT.concat([].concat.apply([],S.slots.map(function(q){return q.ex.map(function(x){return x.name})}))).forEach(function(n){var k=n.toLowerCase();if(!seen[k]){seen[k]=1;out.push(n)}});return out.sort(function(a,b){return a.localeCompare(b)})}
function addHtml(s){
 if(!ADD.open)return '<button class="b" data-addopen="1" style="width:100%;margin:6px 0">+ Hareket ekle</button>';
 var o=allNames().map(function(n){return'<option>'+esc(n)+'</option>'}).join("");
 return '<div class="card"><h2>Hareket ekle</h2><p class="sub">Listeden seç ya da aşağıya yeni hareket adı yaz. Set ve tekrarı boş bırakırsan önceki değer, yoksa 3×12 olur.</p><select id="addsel">'+o+'</select><div class="row" style="margin:8px 0"><input id="addsets" inputmode="numeric" placeholder="Set"><input id="addreps" inputmode="numeric" placeholder="Tekrar"></div><input id="addnew" placeholder="Yeni hareket adı (isteğe bağlı)"><div class="msg" style="color:var(--ac)">'+esc(ADD.msg)+'</div><div class="row"><button class="b p" data-addok="1">Ekle</button><button class="b" data-addcancel="1">Vazgeç</button></div></div>'}
function doAdd(){
 var s=slot(),nn=(document.getElementById("addnew").value||"").trim(),nm=nn||document.getElementById("addsel").value;if(!nm)return;
 if(s.ex.some(function(x){return x.name.toLowerCase()===nm.toLowerCase()})){ADD.msg="Bu hareket bu günde zaten var.";render();return}
 var e0=null;S.slots.forEach(function(q){q.ex.forEach(function(x){if(!e0&&x.name.toLowerCase()===nm.toLowerCase())e0=x})});
 var st=parseInt(document.getElementById("addsets").value)||(e0?e0.sets:3),rp=parseInt(document.getElementById("addreps").value)||(e0?e0.reps:12);
 s.ex.push({name:e0?e0.name:nm,sets:Math.max(1,st),reps:Math.max(1,rp)});ADD.open=false;ADD.msg="";save();render()}
var OPEN={};
function figOrImg(n,d){var k=String(n).toLowerCase().trim();return IMG[k]?'<img class="gif" data-g="'+k+'" alt="">':""}
function demoHtml(name,ei){
 var d=D[String(name).toLowerCase().trim()];if(!d)return"";
 var o=1;
 return ''+(o?'<div class="demo">'+figOrImg(name,d)+'<ol>'+d.t.map(function(x){return'<li>'+x+'</li>'}).join("")+'</ol></div>':'')}
function prog(){
 var h='<p class="sub" style="margin-top:12px">Gün adını, hareketleri, set ve tekrar hedeflerini değiştirebilirsin. Eski kayıtlar silinmez.</p>';
 S.slots.forEach(function(s,si){
  h+='<div class="card"><div class="row" style="margin-bottom:8px"><input data-sl="'+si+'" data-g="label" value="'+esc(s.label)+'"><select data-sl="'+si+'" data-g="dow" style="width:120px">'+["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"].map(function(n,d){return'<option value="'+d+'"'+(s.dow===d?" selected":"")+'>'+n+'</option>'}).join("")+'</select></div>';
  h+='<div class="pe"><span class="lbl" style="text-align:left">Hareket</span><span class="lbl">Set</span><span class="lbl">Tekrar</span><span></span></div>';
  s.ex.forEach(function(e,ei){h+='<div class="pe"><input data-sl="'+si+'" data-x="'+ei+'" data-g="name" value="'+esc(e.name)+'"><input inputmode="numeric" data-sl="'+si+'" data-x="'+ei+'" data-g="sets" value="'+e.sets+'"><input inputmode="numeric" data-sl="'+si+'" data-x="'+ei+'" data-g="reps" value="'+e.reps+'"><button class="b" data-del="'+si+'.'+ei+'">×</button></div>'});
  h+='<button class="b" data-add="'+si+'">+ Hareket ekle</button></div>';
 });
 return h;
}
function back(){
 return'<div class="card"><h2>Yedek</h2><p class="sub">Tüm kayıtların aşağıda. Kopyalayıp bir yere (notlar, mesajlar) kaydet. Telefon veya tarayıcı değişirse buraya yapıştırıp geri yükle.</p><textarea id="bk">'+esc(JSON.stringify(S))+'</textarea><div class="row" style="margin-top:8px"><button class="b p" id="cp">Kopyala</button><button class="b" id="im">İçe aktar</button></div><div class="msg" id="ms">'+esc(msg)+'</div></div>';
}
var app=document.getElementById("app");
app.addEventListener("click",function(e){
 var t=e.target;
 if(t.dataset.restset){openSet()}
 else if(t.dataset.addopen){ADD.open=true;ADD.msg="";render()}
 else if(t.dataset.addcancel){ADD.open=false;render()}
 else if(t.dataset.addok){doAdd()}
 else if(t.dataset.rm){var rs=slot(),ri=+t.dataset.rm,rk=rs.id+"|"+ri;if(RM.k===rk){rs.ex.splice(ri,1);RM.k=null;save()}else RM.k=rk;render()}
 else if(t.dataset.wk){wk+=+t.dataset.wk;render()}
 else if(t.dataset.demo){var nm=slot().ex[+t.dataset.demo].name;OPEN[nm]=!OPEN[nm];render()}
 else if(t.dataset.t){cur=t.dataset.t;view="w";ADD.open=false;RM.k=null;render()}
 else if(t.dataset.v){if(t.dataset.v==="b")bkFrom=EXTRA[view]?view:"w";view=t.dataset.v;render()}
 else if(t.dataset.add!=null){S.slots[+t.dataset.add].ex.push(ex("Yeni hareket",3,12));save();render()}
 else if(t.dataset.del){var p=t.dataset.del.split(".");S.slots[+p[0]].ex.splice(+p[1],1);save();render()}
 else if(t.id==="cp"){var ta=document.getElementById("bk");ta.select();var ok=false;try{ok=document.execCommand("copy")}catch(x){}document.getElementById("ms").textContent=ok?"Kopyalandı.":"Metin seçildi, elle kopyala."}
 else if(t.id==="im"){try{var d=JSON.parse(document.getElementById("bk").value);if(!d.slots||!d.logs)throw 0;S=d;save();cur=S.slots[0].id;msg="Geri yüklendi.";render()}catch(x){document.getElementById("ms").textContent="Geçersiz yedek metni."}}
});
app.addEventListener("input",function(e){
 var t=e.target,d=t.dataset;
 if(d.f){var L=lg(),s=slot(),n=s.ex[+d.e].name;if(!L.ex[n])L.ex[n]=[];if(!L.ex[n][+d.i])L.ex[n][+d.i]={};L.ex[n][+d.i][d.f]=d.f==="done"?t.checked:t.value;save();if(d.f==="done"){var st2=t.closest(".set");if(st2)st2.classList.toggle("dn",t.checked);updProg();if(t.checked)startRest()}}
 else if(t.id==="cw"){lg().cardio.what=t.value;lg().cardio.min=lg().cardio.min!=null?lg().cardio.min:slot().cardio.min;save()}
 else if(t.id==="cm"){lg().cardio.min=t.value;if(lg().cardio.what==null)lg().cardio.what=slot().cardio.what;save()}
 else if(d.g){var s2=S.slots[+d.sl];
  if(d.g==="label")s2.label=t.value;
  else if(d.g==="dow")s2.dow=+t.value;
  else{var x=s2.ex[+d.x];if(d.g==="name")x.name=t.value;else x[d.g]=Math.max(1,parseInt(t.value)||1)}
  save()}
});
app.addEventListener("change",function(e){
 if(e.target.id==="wsel"){wk=+e.target.value;render()}
 if(e.target.dataset.g==="dow")render();
});
var SWK="gymtakip_sw",sw={acc:0,run:0,day:""};
try{var q=JSON.parse(localStorage.getItem(SWK)||"null");if(q&&typeof q.acc==="number")sw=q}catch(e){}
function swMs(){return sw.acc+(sw.run?Date.now()-sw.run:0)}
function swSave(){try{localStorage.setItem(SWK,JSON.stringify(sw))}catch(e){}}
function swDraw(){
 if(!sw.run&&sw.day&&sw.day!==today()){sw.acc=0;sw.day=today();swSave()}
 var s=Math.floor(swMs()/1000),p=function(n){return String(n).padStart(2,"0")};
 document.getElementById("swt").textContent=p(Math.floor(s/3600))+":"+p(Math.floor(s%3600/60))+":"+p(s%60);
 document.getElementById("swb").textContent=sw.run?"Durdur":(swMs()>0?"Devam et":"Başlat")}
document.getElementById("swb").addEventListener("click",function(){
 if(sw.run){sw.acc+=Date.now()-sw.run;sw.run=0}else{if(sw.day&&sw.day!==today())sw.acc=0;sw.run=Date.now()}
 sw.day=today();swSave();swDraw()});
setInterval(swDraw,250);swDraw();
var RK="gymtakip_rest",restDur=60,rest={on:0,end:0,mode:"run",done:0};
try{var rv=parseInt(localStorage.getItem(RK));if(rv>=5)restDur=rv}catch(e){}
function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function updRestBtn(){var b=document.querySelector("[data-restset]");if(b)b.textContent="⏱ Dinlenme: "+fmt(restDur)}
function beep(){try{if(navigator.vibrate)navigator.vibrate([250,100,250])}catch(e){}try{var a=rest.ac;if(!a)return;var o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.2;o.start();setTimeout(function(){o.stop()},450)}catch(e){}}
function restDraw(){
 var ov=document.getElementById("rest");
 if(!rest.on){ov.style.display="none";return}
 ov.style.display="flex";
 var run=rest.mode==="run",left=run?Math.ceil((rest.end-Date.now())/1000):restDur;
 if(run&&left<=0){left=0;if(!rest.done){rest.done=1;beep()}}
 document.getElementById("rtl").textContent=!run?"Dinlenme süresi ayarı":(left<=0?"Dinlenme bitti ✓ Sonraki sete geç":"Dinlenme");
 document.getElementById("rtt").textContent=fmt(Math.max(0,left));
 document.getElementById("rtd").textContent="Toplam süre: "+fmt(restDur)+" · tüm setlerde geçerli";
 document.getElementById("rtc").textContent=!run?"Tamam":(left<=0?"Kapat":"Atla");
 Array.prototype.forEach.call(document.getElementById("rtp").children,function(b){b.className="b"+(+b.dataset.s===restDur?" p":"")})}
function setDur(n){
 n=Math.max(5,Math.min(900,Math.round(n)));
 var run=rest.on&&rest.mode==="run",el=run?Math.max(0,restDur*1000-(rest.end-Date.now())):0;
 restDur=n;if(run){rest.end=Date.now()+restDur*1000-el;rest.done=0}
 try{localStorage.setItem(RK,restDur)}catch(e){}
 restDraw();updRestBtn()}
function audioInit(){try{var C=window.AudioContext||window.webkitAudioContext;rest.ac=rest.ac||new C();if(rest.ac.state==="suspended")rest.ac.resume()}catch(e){}}
function startRest(){audioInit();rest.on=1;rest.mode="run";rest.done=0;rest.end=Date.now()+restDur*1000;restDraw()}
function openSet(){audioInit();rest.on=1;rest.mode="set";restDraw()}
(function(){var p=document.getElementById("rtp");[30,45,60,90,120,180].forEach(function(n){var b=document.createElement("button");b.className="b";b.dataset.s=n;b.textContent=fmt(n);p.appendChild(b)})})();
document.getElementById("rtp").addEventListener("click",function(e){if(e.target.dataset.s)setDur(+e.target.dataset.s)});
document.getElementById("rtm").addEventListener("click",function(){setDur(restDur-15)});
document.getElementById("rtpl").addEventListener("click",function(){setDur(restDur+15)});
document.getElementById("rti").addEventListener("change",function(e){var v=parseInt(e.target.value);if(v)setDur(v);e.target.value=""});
document.getElementById("rtc").addEventListener("click",function(){rest.on=0;restDraw();updRestBtn()});
setInterval(restDraw,250);
function updProg(){var s=slot(),L=lg(),tot=0,dn=0;s.ex.forEach(function(e){tot+=e.sets;(L.ex[e.name]||[]).forEach(function(v,i){if(v&&v.done&&i<e.sets)dn++})});var a=document.getElementById("pgt"),b=document.getElementById("pgb");if(a)a.textContent=dn+" / "+tot+" set";if(b)b.style.width=(tot?Math.round(dn/tot*100):0)+"%"}
function hdrDraw(){var d=new Date();document.getElementById("hsub").textContent=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"][d.getDay()]+" · "+d.getDate()+" "+AY[d.getMonth()]}
hdrDraw();setInterval(hdrDraw,60000);
/* ---------- Cardio bölümleri ve tahmini kalori yakımı ---------- */
function pf(v){return parseFloat(String(v==null?"":v).replace(",","."))}
function bodyW(){return S.cal&&S.cal.prof?pf(S.cal.prof.w):NaN}
function segs(L){L.cardio=L.cardio||{};return L.cardio.segs||(L.cardio.segs=[])}
function lastSegs(){var ks=Object.keys(S.logs).filter(function(k){var c=S.logs[k].cardio;return k.split("|")[0]<date&&c&&c.segs&&c.segs.length}).sort();return ks.length?S.logs[ks[ks.length-1]].cardio.segs:null}
/* Yürüyüş/koşu bandı: ACSM denklemi. Oksijen tüketimi (ml/kg/dk) -> kcal (1 litre oksijen ~ 5 kcal) */
function segKcal(sp,inc,min,bw){sp=pf(sp);inc=pf(inc)||0;min=pf(min);if(!(sp>0&&min>0&&bw>0))return 0;var m=sp*1000/60,g=inc/100,vo=sp<=7?0.1*m+1.8*m*g+3.5:0.2*m+0.9*m*g+3.5;return vo*bw/1000*5*min}
function cardioKcal(sg,bw){var t=0;sg.forEach(function(x){t+=segKcal(x.sp,x.inc,x.min,bw)});return Math.round(t)}
function cardioTxt(sg){var m=0;sg.forEach(function(x){m+=pf(x.min)||0});var k=cardioKcal(sg,bodyW());return Math.round(m*10)/10+" dk"+(k?" · ~"+k+" kcal":"")}
/* Ağırlık: süre = tekrar x 3 sn + set arası dinlenme. Şiddet (MET) ortalama kiloya göre 3 ile 6 arası. kcal = MET x kilo x saat */
function strengthKcal(L,s,bw){
 var sets=0,reps=0,vol=0;
 s.ex.forEach(function(e){(L.ex[e.name]||[]).forEach(function(v,i){if(!v||!v.done||i>=e.sets)return;var r=pf(v.reps)||e.reps,kg=pf(v.kg)||0;sets++;reps+=r;vol+=kg*r})});
 if(!sets||!(bw>0))return{k:0,sets:sets,min:0};
 var min=(reps*3+sets*(restDur||60))/60,met=3+3*Math.min(1,(vol/reps)/bw);
 return{k:Math.round(met*bw*min/60),sets:sets,min:Math.round(min)}}
function burnHtml(s,L){
 var bw=bodyW(),sk=strengthKcal(L,s,bw),ck=cardioKcal(segs(L),bw),tot=sk.k+ck,all=0;
 s.ex.forEach(function(e){all+=e.sets});
 if(!(bw>0))return'<p class="sub" style="margin:0">Kilonu yazınca tahmini yakımı hesaplarım.</p>';
 if(!sk.sets&&!ck)return'<p class="sub" style="margin:0">Setleri tamamladıkça burada tahmini kalori yakımı görünür.</p>';
 return'<div style="font-size:26px;font-weight:700">~'+tot+' <span style="font-size:14px;font-weight:600">kcal</span></div><p class="sub" style="margin:2px 0 8px">'+(all>0&&sk.sets>=all?'Tüm setler tamam ✓ ':'Şu ana kadar ')+'· yaklaşık '+Math.round(tot*.75)+'–'+Math.round(tot*1.25)+' kcal arası</p><div class="row" style="justify-content:space-between;font-size:14px"><span>Ağırlık antrenmanı ('+sk.sets+' set, ~'+sk.min+' dk)</span><b>~'+sk.k+'</b></div><div class="row" style="justify-content:space-between;font-size:14px;margin-top:4px"><span>Cardio</span><b>~'+ck+'</b></div><p class="sub" style="margin:8px 0 0">Kilona, yaptığın set, tekrar ve kiloya göre formülle hesaplanan bir tahmin. Gerçek değer kişiden kişiye çok değişir.</p>'}
function cardioHtml(L,lc){
 var sg=segs(L);
 var h='<div class="card"><div class="row" style="justify-content:space-between"><h2>Cardio</h2><b id="cts">'+cardioTxt(sg)+'</b></div><p class="sub">'+(lc&&lc.length?'Geçen: '+lc.map(function(x){return esc(x.sp||"?")+' km/s, eğim '+esc(x.inc||0)+', '+esc(x.min||"?")+' dk'}).join(' | '):'Hız, eğim ve süreyi bölüm bölüm ekle. Örnek: 3 hızda 5 dk, 5 hızda 10 dk.')+'</p>';
 if(sg.length)h+='<div class="hd" style="grid-template-columns:1fr 1fr 1fr 36px"><span class="lbl">Hız (km/s)</span><span class="lbl">Eğim (%)</span><span class="lbl">Süre (dk)</span><span></span></div>';
 sg.forEach(function(x,i){h+='<div class="pe" style="grid-template-columns:1fr 1fr 1fr 36px"><input data-cs="sp" data-ci="'+i+'" inputmode="decimal" placeholder="hız" value="'+esc(x.sp)+'"><input data-cs="inc" data-ci="'+i+'" inputmode="decimal" placeholder="eğim" value="'+esc(x.inc)+'"><input data-cs="min" data-ci="'+i+'" inputmode="decimal" placeholder="dk" value="'+esc(x.min)+'"><button class="b" data-cdel="'+i+'" style="padding:4px">×</button></div>'});
 h+='<div class="row" style="margin-top:8px"><button class="b p" data-cadd="1" style="flex:1">+ Bölüm ekle</button>'+(!sg.length&&lc&&lc.length?'<button class="b" data-ccopy="1">Geçen seferkini kopyala</button>':'')+'</div></div>';
 return h}
function updBurn(){var b=document.getElementById("burn");if(b)b.innerHTML=burnHtml(slot(),lg());var t=document.getElementById("cts");if(t)t.textContent=cardioTxt(segs(lg()))}
app.addEventListener("click",function(e){
 var d=e.target.dataset;
 if(d.cadd){var sg=segs(lg());sg.push({sp:"",inc:sg.length?sg[sg.length-1].inc:"10",min:""});save();render()}
 else if(d.cdel!=null){segs(lg()).splice(+d.cdel,1);save();render()}
 else if(d.ccopy){var lc=lastSegs();if(lc)lg().cardio.segs=JSON.parse(JSON.stringify(lc));save();render()}});
app.addEventListener("input",function(e){
 var t=e.target,d=t.dataset;
 if(d.cs){var x=segs(lg())[+d.ci];if(x){x[d.cs]=t.value;save()}}
 else if(d.bw){var c=S.cal=S.cal||{};c.prof=c.prof||{sex:"m",act:1.55,goal:"keep"};c.prof.w=t.value;save()}
 if(d.f||d.cs||d.bw)updBurn()});
/* ---------- Hareket GIF'leri: telefonda saklanır (IndexedDB), siteye/GitHub'a yüklenmez ---------- */
var gmsg="";
var GIFMAP={"shoelder-press":"shoulder press machine","shoulder-press":"shoulder press machine","cable-biceps-curl":"cable biceps curl","cable-pushdown":"triceps pushdown","cable-seated-row":"seated cable row","chest-press":"chest press","dumbbell-front-raise":"dumbbell front raise","dumbbell-lateral-raise":"dumbbell lateral raise","dumbbell-seated-calf-raise":"dumbbell seated calf raise","lats_puldown":"lat pulldown","lats-pulldown":"lat pulldown","leg-press-back-pov":"leg press","lever-leg-extension":"leg extension","lever-seated-fly":"pec fly machine","lever-seated-leg-curl":"leg curl"};
function gdb(cb){try{var r=indexedDB.open("gymup",1);r.onupgradeneeded=function(){r.result.createObjectStore("gifs")};r.onsuccess=function(){cb(r.result)};r.onerror=function(){cb(null)}}catch(e){cb(null)}}
function gifLoad(){gdb(function(db){if(!db)return;var req=db.transaction("gifs","readonly").objectStore("gifs").openCursor();req.onsuccess=function(){var c=req.result;if(c){try{IMG[c.key]=URL.createObjectURL(c.value)}catch(e){}c.continue()}else render()}})}
function gifSave(key,file,cb){gdb(function(db){if(!db){cb(false);return}var tx=db.transaction("gifs","readwrite");tx.objectStore("gifs").put(file,key);tx.oncomplete=function(){IMG[key]=URL.createObjectURL(file);cb(true)};tx.onerror=function(){cb(false)}})}
function gifClear(){gdb(function(db){if(!db)return;var tx=db.transaction("gifs","readwrite");tx.objectStore("gifs").clear();tx.oncomplete=function(){Object.keys(IMG).forEach(function(k){delete IMG[k]});render()}})}
function gifKey(name){var b=String(name).toLowerCase().replace(/\.[a-z0-9]+$/,"").replace(/^[-_\s]+/,"").replace(/\s+/g,"-");return GIFMAP[b]||null}
function gifPage(){
 var h='<div class="card" style="margin-top:10px"><h2>Hareket GIF\'leri</h2><p class="sub" style="margin:4px 0 10px">GIF\'ler uygulamaya dahil değil. Kendi GIF dosyalarını telefonundan seçersin, sadece bu telefonda saklanır, internete yüklenmez. Dosya adları chest-press.gif, lats_puldown.gif gibiyse otomatik eşleşir. Eşleşmeyenleri aşağıdan tek tek seçebilirsin.</p><label class="b p" for="gfs" style="display:block;text-align:center;padding:13px">GIF dosyalarını seç (birden fazla)</label><input type="file" id="gfs" accept="*/*" multiple hidden>'+(gmsg?'<div class="msg">'+esc(gmsg)+'</div>':'')+'</div><div class="card">';
 Object.keys(D).forEach(function(k,i){var id="g_"+i;h+='<div class="row" style="justify-content:space-between;padding:6px 0;border-top:1px solid var(--bd)"><span style="flex:1">'+esc(k)+'</span><span>'+(IMG[k]?"✓":"—")+'</span><label class="b" for="'+id+'" style="padding:4px 10px">Seç</label><input type="file" id="'+id+'" data-gk="'+esc(k)+'" accept="*/*" hidden></div>'});
 return h+'<button class="b" data-gclear="1" style="width:100%;margin-top:10px">Hepsini sil</button></div>'}
app.addEventListener("change",function(e){
 var t=e.target;
 if(t.id==="gfs"&&t.files&&t.files.length){
  var fs=[].slice.call(t.files),ok=0,bad=0,left=fs.length;
  var fin=function(){if(--left===0){gmsg=ok+" GIF yüklendi"+(bad?", "+bad+" dosya eşleşmedi (aşağıdan tek tek seç)":"");render()}};
  fs.forEach(function(f){var k=gifKey(f.name);if(!k){bad++;fin();return}gifSave(k,f,function(s){if(s)ok++;else bad++;fin()})})}
 else if(t.dataset.gk&&t.files&&t.files[0]){gifSave(t.dataset.gk,t.files[0],function(){gmsg=t.dataset.gk+" yüklendi";render()})}});
app.addEventListener("click",function(e){if(e.target.dataset.gclear){gifClear();gmsg="Hepsi silindi"}});
gifLoad();
var lastDay=today();
document.addEventListener("visibilitychange",function(){
 if(document.visibilityState==="visible"&&view==="w"&&today()!==lastDay){lastDay=today();var d=new Date().getDay();cur=(S.slots.find(function(s){return s.dow===d})||S.slots[0]).id;wk=curWk();render()}});
render();
