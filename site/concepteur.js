/* CATÉNA 0.2.1 — éditeur local de démonstration, aucun transfert serveur. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const STORAGE='catena-concepteur-v021';const DB='catena-concepteur-fonds-v1';
const LEGEND=[
 {id:'feeder',label:'Connexion ligne / rail / feeder'},
 {id:'support',label:'Connexion ligne / rail / support'},
 {id:'volante',label:'Connexion volante (CV)'},
 {id:'encadrement',label:'Connexion d’encadrement'},
 {id:'self',label:'Connexion ligne / rail / SELF'},
 {id:'rail',label:'Connexion ligne / rail'}
];
const defaultPlan={version:'0.2.1',title:'Plan de protection électrique',paper:'landscape',imageRatio:1.414,mime:'image/png',backgroundName:'Schéma fictif intégré',custom:false,points:[]};
let project=load();let db=null,selected=null,addType=null,drag=null,zoom=1,blobUrl=null,backgroundImageUrl='assets/schema_demo.png';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const rnd=v=>Math.round(Number(v)*100)/100;
function load(){try{const p=JSON.parse(localStorage.getItem(STORAGE));if(p&&Array.isArray(p.points)&&['landscape','portrait','original'].includes(p.paper)&&p.points.length<=250)return {...defaultPlan,...p,points:p.points.filter(o=>o&&typeof o==='object')};}catch(e){}return {...defaultPlan,points:[]};}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(project));$('save-state').textContent='Modifications enregistrées localement';}catch(e){alert('Espace local saturé : exportez le plan PNG et les repères.');}}
function toast(message){const t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,3800);}
function sizeRatio(){return project.paper==='portrait'?1/Math.SQRT2:project.paper==='original'?clamp(project.imageRatio||Math.SQRT2,.35,3):Math.SQRT2;}
function height(){return Math.round(1000/sizeRatio());}
function getPoint(){return project.points.find(p=>p.id===selected);}
function indexNext(){const existing=new Set(project.points.map(p=>String(p.number)));for(let n=1;n<501;n++){if(!existing.has(String(n)))return String(n);}return 'N';}
function symbolSvg(type,size=32){const stroke='#446ab0'; const s=Number(size);
 if(type==='encadrement')return `<polygon points="${-s*.5},${-s*.45} ${s*.54},0 ${-s*.5},${s*.45}" fill="#3278c8" stroke="#a1a9af" stroke-width="${Math.max(2,s*.11)}" stroke-linejoin="round"/>`;
 if(type==='volante')return `<path d="M ${-s*.42} ${s*.3} C ${-s*.42} ${-s*.48}, ${s*.42} ${-s*.48}, ${s*.42} ${s*.3}" fill="none" stroke="#244e92" stroke-width="${s*.22}" stroke-linecap="butt"/><path d="M ${-s*.4} ${s*.3} C ${-s*.4} ${-s*.42}, ${s*.4} ${-s*.42}, ${s*.4} ${s*.3}" fill="none" stroke="#4b83d9" stroke-width="${s*.11}"/>`;
 if(type==='feeder'){let pts=[];for(let i=0;i<10;i++){const angle=i*Math.PI/5-Math.PI/2,r=i%2?s*.21:s*.46;pts.push(`${Math.cos(angle)*r},${Math.sin(angle)*r}`);}return `<polygon points="${pts.join(' ')}" fill="#ffd64b" stroke="#638acb" stroke-width="${s*.09}" stroke-linejoin="round"/>`;}
 if(type==='support')return `<circle cx="0" cy="0" r="${s*.4}" fill="#fff" stroke="${stroke}" stroke-width="${s*.12}"/><path d="M ${-s*.23} ${-s*.23} L ${s*.23} ${s*.23} M ${s*.23} ${-s*.23} L ${-s*.23} ${s*.23}" stroke="${stroke}" stroke-width="${s*.12}" stroke-linecap="round"/>`;
 if(type==='self')return `<rect x="${-s*.39}" y="${-s*.39}" width="${s*.78}" height="${s*.78}" fill="#fff" stroke="${stroke}" stroke-width="${s*.11}"/><path d="M ${-s*.22} ${-s*.22} L ${s*.22} ${s*.22} M ${s*.22} ${-s*.22} L ${-s*.22} ${s*.22}" stroke="${stroke}" stroke-width="${s*.13}" stroke-linecap="round"/>`;
 return `<path d="M ${-s*.33} ${-s*.33} L ${s*.33} ${s*.33} M ${s*.33} ${-s*.33} L ${-s*.33} ${s*.33}" stroke="${stroke}" stroke-width="${s*.16}" stroke-linecap="round"/>`;
}
function iconFor(type){return `<svg viewBox="-30 -30 60 60" aria-hidden="true">${symbolSvg(type,48)}</svg>`;}
function drawSvg(includeSelection=true){const H=height();let all='';
 for(const p of project.points){const x=clamp(+p.x||0,0,100)*10,y=clamp(+p.y||0,0,100)*H/100, lx=clamp(+p.lx||0,0,100)*10,ly=clamp(+p.ly||0,0,100)*H/100;
 const active=includeSelection&&p.id===selected;const s=clamp(Number(p.size)||1,.55,2.25)*36;let span='';
 if(p.type==='volante'){
   const ax=clamp(+p.ax||0,0,100)*10,ay=clamp(+p.ay||0,0,100)*H/100,bx=clamp(+p.bx||0,0,100)*10,by=clamp(+p.by||0,0,100)*H/100;
   const cy=Math.min(ay,by)-clamp(s*.55,16,50);
   span=`<path d="M ${ax} ${ay} C ${ax} ${cy}, ${bx} ${cy}, ${bx} ${by}" stroke="#355cb0" stroke-width="${active?7:4}" fill="none" opacity=".93" />`;
   for(const [xx,yy,part,letter] of [[ax,ay,'a','A'],[bx,by,'b','B']])span+=`<g data-id="${esc(p.id)}" data-part="${part}" style="cursor:grab"><circle cx="${xx}" cy="${yy}" r="${active?13:9}" fill="#275eb7" stroke="white" stroke-width="2"/><text x="${xx}" y="${yy+3}" font-size="9" text-anchor="middle" font-weight="800" fill="white">${letter}</text></g>`;
 }
 all+=`<g data-marker="${esc(p.id)}">${span}<path d="M ${lx} ${ly} L ${x} ${y}" stroke="${active?'#1f6ce0':'#466b9c'}" stroke-width="${active?4:2.2}" stroke-dasharray="${active?'8 5':'none'}" fill="none" class="${active?'selected-glow':''}" pointer-events="none" />
 <g data-id="${esc(p.id)}" data-part="symbol" style="cursor:grab" transform="translate(${x} ${y})"><circle r="${s*.62}" fill="transparent" stroke="${active?'#8ab8ff':'none'}" stroke-width="2" />${symbolSvg(p.type,s)}</g>
 <g data-id="${esc(p.id)}" data-part="label" class="label" transform="translate(${lx} ${ly})"><rect x="-23" y="-22" width="46" height="44" rx="2" fill="${active?'#ffdf55':'#fff577'}" stroke="${active?'#355aa1':'#a48b00'}" stroke-width="${active?3:1.4}"/><text text-anchor="middle" y="7" font-size="21" font-family="Arial,sans-serif" font-weight="800" fill="#141414">${esc(p.number)}</text></g></g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${H}" width="1000" height="${H}">${all}</svg>`;
}
function renderSvg(){const svg=$('overlay');svg.setAttribute('viewBox',`0 0 1000 ${height()}`);const src=drawSvg(true);svg.innerHTML=src.slice(src.indexOf('>')+1,src.lastIndexOf('</svg>'));}
function renderPalette(){$('palette').innerHTML=LEGEND.map(s=>`<button type="button" data-type="${s.id}" class="${addType===s.id?'active':''}">${iconFor(s.id)}<span>${esc(s.label)}</span></button>`).join('');$('cancel-add').hidden=!addType;}
function renderProperties(){const p=getPoint();$('no-selection').hidden=!!p;$('properties').hidden=!p;if(!p)return;$('field-number').value=p.number;$('field-type').value=p.type;$('field-note').value=p.note||'';$('size-text').textContent=`${Math.round((p.size||1)*100)} %`;$('drag-help').textContent=p.type==='volante'?'Déplace les deux extrémités A et B de la connexion de chaque côté du sectionnement, ainsi que le numéro jaune.':'Déplace le symbole, puis le numéro jaune indépendamment.';}
function update(){renderPalette();renderProperties();renderSvg();$('board-meta').textContent=`${project.paper==='landscape'?'A4 paysage':project.paper==='portrait'?'A4 portrait':'Format original'} · ${project.points.length} symbole(s)`;$('loaded-name').textContent='Fond : '+project.backgroundName;$('paper-select').value=project.paper;$('pdf-warning').hidden=project.mime!=='application/pdf';$('btn-export').disabled=project.mime==='application/pdf';const vp=$('viewport');const base=Math.max(300,vp.clientWidth-38);const paper=$('paper');paper.style.width=Math.round(base*zoom)+'px';paper.style.aspectRatio=String(sizeRatio());$('zoom-label').textContent=Math.round(zoom*100)+' %';}
function makePoint(type,x,y){const id='p-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const p={id,number:indexNext(),type,note:'',x:rnd(x),y:rnd(y),lx:rnd(clamp(x+6,2,97)),ly:rnd(clamp(y-9,2,97)),size:1};if(type==='volante'){p.ax=rnd(clamp(x-4,2,98));p.ay=rnd(y);p.bx=rnd(clamp(x+4,2,98));p.by=rnd(y);}project.points.push(p);selected=id;addType=null;save();update();toast('Symbole ajouté. Son numéro peut être déplacé indépendamment.');}
function coords(evt){const rect=$('paper').getBoundingClientRect();return {x:clamp((evt.clientX-rect.left)/rect.width*100,1,99),y:clamp((evt.clientY-rect.top)/rect.height*100,1,99)};}
function movePart(p,part,v){if(part==='symbol'){if(p.type==='volante')return;p.x=rnd(v.x);p.y=rnd(v.y);}else if(part==='label'){p.lx=rnd(v.x);p.ly=rnd(v.y);}else if(part==='a'||part==='b'){p[part+'x']=rnd(v.x);p[part+'y']=rnd(v.y);p.x=rnd((p.ax+p.bx)/2);p.y=rnd((p.ay+p.by)/2);}}
$('overlay').addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;const g=e.target.closest('[data-id][data-part]');const v=coords(e);if(addType){makePoint(addType,v.x,v.y);return;}if(!g){selected=null;update();return;}e.preventDefault();selected=g.dataset.id;const p=getPoint();if(!p)return;drag={pointer:e.pointerId,part:g.dataset.part,id:p.id,ox:v.x,oy:v.y,px:p.x,py:p.y,plx:p.lx,ply:p.ly,ax:p.ax,ay:p.ay,bx:p.bx,by:p.by,moved:false};$('overlay').setPointerCapture?.(e.pointerId);update();});
$('overlay').addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;const p=getPoint();if(!p)return;const c=coords(e),dx=c.x-drag.ox,dy=c.y-drag.oy;if(Math.abs(dx)+Math.abs(dy)>.5)drag.moved=true;if(drag.part==='symbol')movePart(p,'symbol',{x:clamp(drag.px+dx,1,99),y:clamp(drag.py+dy,1,99)});if(drag.part==='label')movePart(p,'label',{x:clamp(drag.plx+dx,1,99),y:clamp(drag.ply+dy,1,99)});if(drag.part==='a')movePart(p,'a',{x:clamp(drag.ax+dx,1,99),y:clamp(drag.ay+dy,1,99)});if(drag.part==='b')movePart(p,'b',{x:clamp(drag.bx+dx,1,99),y:clamp(drag.by+dy,1,99)});renderSvg();});
$('overlay').addEventListener('pointerup',e=>{if(drag?.pointer===e.pointerId){if(drag.moved)save();drag=null;renderProperties();renderSvg();}});$('overlay').addEventListener('pointercancel',()=>{drag=null;});
$('palette').addEventListener('click',e=>{const b=e.target.closest('button[data-type]');if(!b)return;addType=b.dataset.type;renderPalette();toast('Clique sur le schéma pour positionner la connexion.');});$('cancel-add').onclick=()=>{addType=null;renderPalette();};
$('field-number').addEventListener('change',e=>{const p=getPoint();if(!p)return;const n=e.target.value.trim().slice(0,12);if(!n){e.target.value=p.number;return;}if(project.points.some(x=>x.id!==p.id&&x.number===n)){toast('Numéro déjà utilisé.');e.target.value=p.number;return;}p.number=n;save();update();});
$('field-type').innerHTML=LEGEND.map(s=>`<option value="${s.id}">${esc(s.label)}</option>`).join('');
$('field-type').onchange=e=>{const p=getPoint();if(!p)return;p.type=e.target.value;if(p.type==='volante'){p.ax=rnd(clamp(p.x-4,1,99));p.ay=p.y;p.bx=rnd(clamp(p.x+4,1,99));p.by=p.y;}save();update();};
$('field-note').onchange=e=>{const p=getPoint();if(p){p.note=e.target.value.trim().slice(0,90);save();}};
function size(delta){const p=getPoint();if(!p)return;p.size=rnd(clamp((p.size||1)+delta,.55,2.25));save();update();}
$('size-down').onclick=()=>size(-.1);$('size-up').onclick=()=>size(.1);
$('delete-symbol').onclick=()=>{const p=getPoint();if(!p||!confirm(`Supprimer le repère ${p.number} ?`))return;project.points=project.points.filter(q=>q.id!==p.id);selected=null;save();update();};
$('clear').onclick=()=>{if(confirm('Supprimer tous les symboles ? Le fond de plan sera conservé.')){project.points=[];selected=null;save();update();}};
$('paper-select').onchange=e=>{project.paper=e.target.value;save();update();};
$('zoom-in').onclick=()=>{zoom=clamp(zoom+.2,.6,3);update();};$('zoom-out').onclick=()=>{zoom=clamp(zoom-.2,.6,3);update();};$('fit').onclick=()=>{zoom=1;update();};
function getDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function putBlob(key,blob){return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(blob,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function getBlob(key){return new Promise((resolve,reject)=>{const req=db.transaction('files','readonly').objectStore('files').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function showBackground(blob){if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=blob?URL.createObjectURL(blob):null;const pdf=project.mime==='application/pdf';$('background-image').hidden=pdf;$('background-pdf').hidden=!pdf;if(pdf){$('background-pdf').data=blobUrl||'';}else{$('background-image').src=blobUrl||'assets/schema_demo.png';}backgroundImageUrl=blobUrl||'assets/schema_demo.png';update();}
function readDimensions(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);resolve(im.naturalWidth/im.naturalHeight);};im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Image illisible'));};im.src=url;});}
async function importFile(file){if(!file)return;const n=file.name||'Fichier';const pdf=file.type==='application/pdf'||n.toLowerCase().endsWith('.pdf');const goodImage=['image/png','image/jpeg','image/webp'].includes(file.type);if(!pdf&&!goodImage)return toast('Choisir un PNG, JPEG, WEBP ou PDF.');if(file.size>20_000_000)return toast('Fichier trop volumineux (maximum 20 Mo).');if(!db)return toast('Stockage local indisponible.');try{const ratio=pdf?Math.SQRT2:await readDimensions(file);await putBlob('background',file);project.custom=true;project.backgroundName=n;project.mime=pdf?'application/pdf':file.type;project.imageRatio=ratio;project.paper='original';save();showBackground(file);toast(pdf?'PDF chargé localement. Préférer une image pour placer précisément les repères.':'Image chargée. Le plan est prêt à être annoté.');}catch(e){toast('Import impossible : '+e.message);}}
$('file-input').onchange=e=>{importFile(e.target.files?.[0]);e.target.value='';};$('example-button').onclick=()=>{$('file-input').click();toast('Sélectionne le fichier « EXEMPLE_PPE1_Excel.png » téléchargé avec le ZIP.');};
function download(name,blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove();},1600);}
$('save-json').onclick=()=>download('CATENA_reperes_'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify({...project,attention:'Fond stocké séparément dans IndexedDB : exporter aussi le plan PNG. Les coordonnées n’ont aucune valeur technique.'},null,2)],{type:'application/json'}));
function loadImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});}
$('btn-export').onclick=async()=>{if(project.mime==='application/pdf')return toast('Export PNG non disponible depuis le PDF natif. Importer une image du PDF.');try{const ratio=sizeRatio(),canvas=document.createElement('canvas');canvas.width=2400;canvas.height=Math.round(2400/ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);const bg=await loadImage(backgroundImageUrl);const scale=Math.min(canvas.width/bg.width,canvas.height/bg.height),w=bg.width*scale,h=bg.height*scale;ctx.drawImage(bg,(canvas.width-w)/2,(canvas.height-h)/2,w,h);const svg=new Blob([drawSvg(false)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(svg);try{const overlay=await loadImage(url);ctx.drawImage(overlay,0,0,canvas.width,canvas.height);}finally{URL.revokeObjectURL(url);}canvas.toBlob(b=>{if(!b)return toast('Export impossible.');download('CATENA_plan_perchage_'+new Date().toISOString().slice(0,10)+'.png',b);toast('Image du plan exportée. Vérification technique nécessaire avant usage.');},'image/png');}catch(e){toast('Export impossible : '+e.message);}};
window.addEventListener('resize',update);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&addType){addType=null;renderPalette();}});
(async()=>{try{db=await getDb();if(project.custom){const blob=await getBlob('background');if(blob)showBackground(blob);else{project.custom=false;project.backgroundName='Schéma fictif intégré';project.mime='image/png';showBackground(null);}}}catch(e){toast('Enregistrement des fonds indisponible.');}update();})();
})();
