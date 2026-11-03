const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','site');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const manifest=JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.display,'standalone');
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.id,'./');
assert.ok(manifest.icons.some(i=>i.sizes==='192x192'));
assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
const html=read('index.html');
assert.match(html,/rel="manifest"/);
assert.match(html,/src="pwa.js"/);
const sw=read('sw.js');
assert.match(sw,/addEventListener\('install'/);
assert.match(sw,/addEventListener\('fetch'/);
for(const res of ['index.html','styles.css','core.js','app.js','pwa.js','manifest.webmanifest','assets/schema_demo.png','assets/icon-192.png','assets/icon-512.png']){
 assert.ok(fs.existsSync(path.join(root,res)),`Ressource manquante: ${res}`);
 assert.ok(sw.includes("'./"+res+"'"),`Non précaché: ${res}`);
}
// Protection contre la mise en ligne accidentelle de données opérationnelles précédentes.
for(const file of ['app.js','index.html','styles.css']) {
 const content=read(file);
 for(const secret of ['Montereau','80/06','80/32A','80/17','PPEC SST','S45-2026'])assert.ok(!content.includes(secret),`Donnée source non anonymisée dans ${file}: ${secret}`);
}
assert.ok(!fs.existsSync(path.join(root,'assets','schema_s11_extrait.png')));
assert.ok(fs.existsSync(path.join(__dirname,'..','.github','workflows','deploy-pages.yml')));
console.log('✓ PWA : manifest, ressources hors ligne, sécurité des données de démonstration.');
