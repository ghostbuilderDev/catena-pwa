/* PROTECAT 0.3.1 : uniquement des ressources publiques de démonstration. */
const VERSION='protecat-pwa-0.3.1';
const SHELL=['./','./index.html','./styles.css','./core.js','./app.js','./pwa.js','./manifest.webmanifest','./assets/schema_demo.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>(key.startsWith('catena-pwa-')||key.startsWith('protecat-pwa-'))&&key!==VERSION).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  // Pas de cache des données utilisateur, photos, API, autorisations ou réponses authentifiées.
  if(/\/(api|auth|rest|storage)\//.test(url.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{const response=await fetch(request,{cache:'no-store'});if(response.ok){const cache=await caches.open(VERSION);await cache.put('./index.html',response.clone());}return response;}
      catch(e){return (await caches.match('./index.html'))||Response.error();}
    })());
  }else{
    event.respondWith((async()=>{
      const cached=await caches.match(request);
      if(cached)return cached;
      return fetch(request);
    })());
  }
});
