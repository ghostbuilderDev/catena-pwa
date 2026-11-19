/* PEC 0.3.0 — Amélioration locale NON-IA, sans service distant ni reconstruction du plan. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const editor=window.PEC_EDITOR;
if(!editor)return;
const modal=$('enhance-dialog'),canvas=$('enhance-preview');if(!modal||!canvas)return;
const msg=$('enhance-message');const ctx=canvas.getContext('2d',{willReadFrequently:true});
let source=null,sourceName='',image=null,processed=false,previewOriginal=false;
function say(text){msg.textContent=text;}
function opens(){modal.showModal();loadSource();}
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open('pec-enhancement-backup-v1',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('backup'))r.result.createObjectStore('backup');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function writeBackup(blob,processedName){return new Promise(async(resolve,reject)=>{try{const d=await db();const tx=d.transaction('backup','readwrite');tx.objectStore('backup').put({original:blob,sourceName,processedName},'latest');tx.oncomplete=()=>{d.close();resolve();};tx.onerror=()=>reject(tx.error);}catch(e){reject(e);}});}
function readBackup(){return new Promise(async(resolve,reject)=>{try{const d=await db();const r=d.transaction('backup','readonly').objectStore('backup').get('latest');r.onsuccess=()=>{d.close();resolve(r.result||null);};r.onerror=()=>reject(r.error);}catch(e){reject(e);}});}
async function loadSource(){try{
 source=await editor.currentBackgroundBlob();sourceName=editor.project().backgroundName||'S11';
 if(!source||source.type==='application/pdf'){source=null;image=null;say('Pour améliorer la lisibilité, importe une image PNG/JPEG/WEBP. Le PDF est consultable, mais n’est pas converti automatiquement ici.');return;}
 const bmp=await createImageBitmap(source);image=bmp;processed=false;previewOriginal=false;
 $('enhance-mode').value='net';$('enhance-strength').value='35';renderPreview();
 say(`Image source ${bmp.width} × ${bmp.height}. L'amélioration reste un filtre de lisibilité, sans IA ni reconstitution fiable de détails.`);
 }catch(e){image=null;say('Impossible de lire le fond du plan : '+e.message);}}
function drawOriginal(maxWidth){const w=Math.min(image.width,maxWidth),h=Math.max(1,Math.round(image.height*w/image.width));canvas.width=w;canvas.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);}
function filter(level,mode){const W=canvas.width,H=canvas.height;if(!W||!H)return;
 let data=ctx.getImageData(0,0,W,H);const src=data.data,dest=new Uint8ClampedArray(src);
 const factor=mode==='doux'?1.06:mode==='contraste'?1.16:1.11;
 const alpha=level/100*(mode==='net'?.52:mode==='contraste'?.22:.12);
 const n=src.length;
 for(let i=0;i<n;i+=4){for(let c=0;c<3;c++){dest[i+c]=Math.max(0,Math.min(255,(src[i+c]-128)*factor+128+2));}}
 if(alpha>.01&&W>2&&H>2){for(let y=1;y<H-1;y++){for(let x=1;x<W-1;x++){let p=(y*W+x)*4;for(let c=0;c<3;c++){
   const old=dest[p+c],around=(dest[p+c-4]+dest[p+c+4]+dest[p+c-W*4]+dest[p+c+W*4])/4;
   data.data[p+c]=Math.max(0,Math.min(255,old+alpha*(old-around)*2.6));
 }}}}else{data.data.set(dest);}
 ctx.putImageData(data,0,0);
}
function renderPreview(maxWidth=1250){if(!image)return;drawOriginal(maxWidth);if(previewOriginal)return;filter(Number($('enhance-strength').value),$('enhance-mode').value);processed=true;}
$('enhance-open').addEventListener('click',opens);
$('enhance-close').addEventListener('click',()=>modal.close());
$('enhance-mode').onchange=()=>{previewOriginal=false;renderPreview();};
$('enhance-strength').oninput=()=>{previewOriginal=false;renderPreview();};
$('enhance-compare').onclick=()=>{previewOriginal=!previewOriginal;renderPreview();$('enhance-compare').textContent=previewOriginal?'Afficher corrigé':'Afficher original';};
$('enhance-apply').onclick=async()=>{if(!image||!source)return say('Importe une image avant de la corriger.');const b=$('enhance-apply');b.disabled=true;
 try{previewOriginal=false;renderPreview(3600);const blob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('Conversion PNG impossible')),'image/png'));
 const filename=`PEC_S11_ameliore_${new Date().toISOString().slice(0,10)}.png`;
 await writeBackup(source,filename);
 await editor.importFile(new File([blob],filename,{type:'image/png'}));
 say('Fond corrigé importé. Vérifie les repères visuellement avec le document original approuvé avant tout usage.');modal.close();
 }catch(e){say('Traitement impossible : '+e.message);}finally{b.disabled=false;}
};
$('enhance-restore').onclick=async()=>{const b=$('enhance-restore');b.disabled=true;try{const saved=await readBackup();if(!saved?.original)return say('Aucun original sauvegardé.');if(editor.project().backgroundName!==saved.processedName)return say('Le fond a changé depuis l’amélioration : restauration automatique refusée pour éviter d’écraser un autre plan.');
 await editor.importFile(new File([saved.original],saved.sourceName,{type:saved.original.type||'image/png'}));say('Original restauré, sans modification des symboles.');modal.close();
 }catch(e){say('Restauration impossible : '+e.message);}finally{b.disabled=false;}};
})();
