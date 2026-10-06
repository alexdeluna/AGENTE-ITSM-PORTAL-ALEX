const CACHE='ace-independent-v1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./firebase.js','./firebase-config.js','./manifest.webmanifest','./assets/service-default.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});
