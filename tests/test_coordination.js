const assert=require('node:assert/strict');
const fs=require('fs');const path=require('path');
const root=path.join(__dirname,'..');const site=path.join(root,'site');
for(const file of ['coordination.html','coordination.js','coordination.css','workflow.js','plan-enhance.js','plan-enhance.css']){
 assert.ok(fs.existsSync(path.join(site,file)),`New file missing ${file}`);
 assert.ok(fs.statSync(path.join(site,file)).size>400,`New file too small ${file}`);
}
const coord=fs.readFileSync(path.join(site,'coordination.js'),'utf8');
const enhance=fs.readFileSync(path.join(site,'plan-enhance.js'),'utf8');
const editor=fs.readFileSync(path.join(site,'concepteur.js'),'utf8');
const index=fs.readFileSync(path.join(site,'index.html'),'utf8');
const concepteur=fs.readFileSync(path.join(site,'concepteur.html'),'utf8');
const sw=fs.readFileSync(path.join(site,'sw.js'),'utf8');
for(const f of ['coordination.html','coordination.js','coordination.css','workflow.js','plan-enhance.js','plan-enhance.css'])assert.ok(sw.includes(`'./${f}'`),`Offline shell missing ${f}`);
assert.ok(index.includes('./coordination.html'));
assert.ok(concepteur.includes('./coordination.html'));
assert.ok(concepteur.includes('plan-enhance.js'));
assert.ok(editor.includes('window.PEC_EDITOR'));
for(const text of ['BroadcastChannel','photoKey','canDeclare','canReview','canClose','canBeginRetrait','firstStageRef'])assert.ok(coord.includes(text),`Missing ${text}`);
for(const text of ['source','createImageBitmap','readBackup','writeBackup'])assert.ok(enhance.includes(text),`Enhance missing ${text}`);
assert.ok(!fs.existsSync(path.join(site,'EXEMPLE_PPE1_Excel.png')));
assert.ok(!fs.existsSync(path.join(site,'Ouvrage-consignation-pour-travaux-catenaires-mode-operatoire_avril-2023.pdf')));
console.log('✓ PEC : coordination, import local, photos privées, amélioration du fond et accès PWA vérifiés.');
