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
assert.ok(fs.readFileSync(path.join(site,'sw.js'),'utf8').includes("pec-pwa-0.3.0-coordination"));
// Régression : aucune duplication d'arc au centre, raccordement à deux extrémités.
const volanteJs=js.substring(js.indexOf("if(p.type==='volante'){"),js.indexOf('} else {', js.indexOf("if(p.type==='volante'){")));
assert.ok(!volanteJs.includes('symbolSvg(p.type,s)'), 'La connexion volante contient encore le second arc au centre.');
// Le script de mise à jour est présent seulement dans le ZIP local, pas sur le site.
const updaterFile=path.join(root,'MAJ_TERMUX.sh');
if(fs.existsSync(updaterFile)){
  const updater=fs.readFileSync(updaterFile,'utf8');
  assert.ok(updater.includes('site/concepteur.js'));
  assert.ok(updater.includes('SOURCE='));
  assert.ok(updater.includes('--verify'));
  assert.ok(!updater.includes('SRC="$WORK/archive/PEC_PWA_V0_2_3_CONCEPTEUR"'));
}
console.log('✓ Concepteur : import image/PDF, surcouche SVG et cache PWA vérifiés.');
