/* Gym Up - internetsiz çalışma. Dosyaları önce telefona kaydeder, sonra internet olmadan da açar.
   Yeni dosya (örneğin yeni bir .js) eklersen adını FILES listesine de ekle. */
var V="gymup-v1";
var FILES=["./","index.html","style.css","gifs.js","exercises.js","app.js","kalori.js","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
/* Önce kayıtlı dosyayı göster, arkada internetten yenisini indir (bir sonraki açılışta güncel olur). */
self.addEventListener("fetch",function(e){
 if(e.request.method!=="GET")return;
 e.respondWith(caches.open(V).then(function(c){return c.match(e.request).then(function(r){
  var f=fetch(e.request).then(function(n){if(n&&n.ok)c.put(e.request,n.clone());return n}).catch(function(){return r});
  return r||f})}))});
