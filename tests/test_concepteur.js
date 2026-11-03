// Tests du concepteur exécutables sur le ZIP complet ET sur le dépôt public.
// Le dossier EXEMPLE_LOCAL_PPE1_EXCEL est volontairement absent de GitHub.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const site=path.join(root,'site');
for (const f of ['concepteur.html','concepteur.js','concepteur.css']) {
  const filepath=path.join(site,f);
  assert.ok(fs.existsSync(filepath) && fs.statSync(filepath).size>1000,`Fichier du concepteur manquant : ${f}`);
}
const html=fs.readFileSync(path.join(site,'concepteur.html'),'utf8');
const js=fs.readFileSync(path.join(site,'concepteur.js'),'utf8');
assert.match(html,/image\/png,image\/jpeg,image\/webp,application\/pdf/);
for (const name of ['importFile','drawSvg','movePart','symbolSvg','getDb']) {
  assert.match(js,new RegExp('function '+name+'\\('),`Fonction ${name} absente`);
}
const sw=fs.readFileSync(path.join(site,'sw.js'),'utf8');
for(const f of ['concepteur.html','concepteur.js','concepteur.css']) {
  assert.ok(sw.includes(`'./${f}'`),`Cache PWA : ${f} absent`);
}
assert.ok(!fs.existsSync(path.join(site,'EXEMPLE_PPE1_Excel.png')),'Le PPE1 privé ne doit pas être publié dans site/');
const privateDir=path.join(root,'EXEMPLE_LOCAL_PPE1_EXCEL');
if (fs.existsSync(privateDir)) {
  const img=path.join(privateDir,'EXEMPLE_PPE1_Excel.png');
  assert.ok(fs.existsSync(img) && fs.statSync(img).size>100000,'Exemple PPE1 local incomplet');
  console.log('✓ Exemple PPE1 présent dans le ZIP local ; exclu du site public.');
} else {
  console.log('✓ Aucun exemple PPE1 privé dans le dépôt public : comportement attendu.');
}
// Non-régression : les plans locaux de la version 0.2.2 restent accessibles.
assert.ok(js.includes("const STORAGE='catena-concepteur-v021'"));
assert.ok(js.includes("const DB='catena-concepteur-fonds-v1'"));
assert.ok(fs.readFileSync(path.join(site,'sw.js'),'utf8').includes("catena-pwa-0.2.3"));
// Le script Termux n’est pas commité dans le dépôt public : ne le tester que dans le ZIP livré.
const updaterFile=path.join(root,'PEC_MAJ_GITHUB_TERMUX.sh');
if (fs.existsSync(updaterFile)) {
 const updater=fs.readFileSync(updaterFile,'utf8');
 assert.ok(updater.includes('PEC_PWA_V0_2_3_CONCEPTEUR'));
 assert.ok(!updater.includes('SRC="$WORK/archive/CATENA_PWA_V0_2_2_CONCEPTEUR"'));
}
console.log('✓ Concepteur : import image/PDF, surcouche SVG et cache PWA vérifiés.');
