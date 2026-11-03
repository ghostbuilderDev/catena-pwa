/* CATÉNA 0.2.0 — PWA de démonstration, sans backend ni authentification. */
(() => {
'use strict';
const C = window.CatenaCore;
const SAVE_KEY='catena-pwa-demo-v02';
const DB_NAME='catena-pwa-demo-photos-v02';
const NAME={chef:'A. Martin',agent1:'S. Leroy',agent2:'L. Bernard',agent3:'M. Dubois'};
const TITLES={plan:'Plan interactif',dashboard:'Vue d’ensemble',mine:'Mes perches',review:'Recollement',messages:'Transmissions',settings:'Préparation du plan'};
const TYPES=['CLR','CV','CLR Feeder','CLRS','SELF','Autre (à préciser)'];
const SYMBOLS=[['ligne-rail','│','Connexion ligne / rail'],['encadrement','▶','Connexion d’encadrement'],['support','∩','Connexion ligne / rail / support'],['self','✕','Connexion ligne / rail / SELF'],['volante','◇','Connexion volante'],['feeder','▷','Connexion ligne / rail Feeder']];
function symbolInfo(id){return SYMBOLS.find(s=>s[0]===id)||SYMBOLS[0];}
const MODE_LABELS={pose:'pose',depose:'dépose'};
const doc=document;
let view='dashboard',selected='1',currentUser='chef',zoomWidth=1150,placement=false,editingPin=false,drag=null,suppressClick=false;
let activeTemplate='pose',photoBuffer=null,imgURL='assets/schema_demo.png',db=null;
const listEl=doc.getElementById('view-content');
const modalRoot=doc.getElementById('modal-root');
const toastRoot=doc.getElementById('toast-root');

function initialState(){
 const defs=[
  ['P01','V1','S01','CLR',true,'agent1',12,47],
  ['P02','V2','S01','CLR',true,'agent1',20,55],
  ['P03','V1','S02','CLR',true,'agent2',30,49],
  ['P04','V2','S02','CLR',true,'agent2',36,57],
  ['P05','V2','S03','CLR',true,'agent1',44,60],
  ['P06','V1','S03','CLR',true,'agent2',50,49],
  ['P07','V2','S04','CLR',true,'agent3',56,57],
  ['P08','V1','S04','CLR',true,'agent3',62,45],
  ['P09','V2','S05','CV',false,'agent2',69,58],
  ['P10','V1','S05','CV',false,'agent1',76,43],
  ['P11','V2','S06','CLR Feeder',true,'agent3',84,65],
  ['P12','V1','S06','CLR Feeder',true,'agent3',90,48]
 ];
 return {version:'0.2.0',operation:'Exercice fictif CATÉNA',week:'—',year:2026,planName:'Schéma pédagogique fictif · PWA 0.2.0',phase:'preparation',planLocked:false,sourceWarning:true,customPlan:false,imgRatio:1718/755,points:defs.map((a,i)=>({uid:'c'+i,number:a[0],voie:a[1],support:a[2],type:a[3],symbol:a[3]==='CV'?'volante':a[3]==='CLR Feeder'?'feeder':'ligne-rail',flag:a[4],agent:a[5],x:a[6],y:a[7],pose:null,depose:null})),events:[{id:'init',at:new Date().toISOString(),kind:'import',actor:'system',number:null,detail:'Démo fictive initialisée : aucune donnée du chantier réel, repères illustratifs uniquement.'}],authorizationRef:'',removalRef:'',closedAt:null};
}
function loadState(){
 try{const value=JSON.parse(localStorage.getItem(SAVE_KEY));if(value&&Array.isArray(value.points)&&Array.isArray(value.events)&&['preparation','pose','depose','terminee'].includes(value.phase))return value;}catch(e){}
 return initialState();
}
let state=loadState();
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch(e){toast('Stockage saturé : exportez votre démonstration.','error');return false;}}
function stamp(){return new Date().toISOString();}
function makeId(){return (window.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);}
function escapeHtml(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function esc(x){return escapeHtml(x);}
function formatTime(t){return t?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(t)):'—';}
function name(id){return NAME[id]||id||'Inconnu';}
function isChef(){return currentUser==='chef';}
function point(uid){return state.points.find(x=>x.uid===uid);}
function selectedPoint(){return point(selected)||state.points[0];}
function log(kind,number,detail,photoKey=null){state.events.unshift({id:makeId(),at:stamp(),kind,number,detail,actor:currentUser,photoKey});}
function apply(){persist();render();}
function toast(msg,type=''){toastRoot.innerHTML=`<div class="toast ${type}">${esc(msg)}</div>`;setTimeout(()=>{if(toastRoot.firstElementChild?.textContent===msg)toastRoot.innerHTML='';},4100);}
function el(id){return doc.getElementById(id);}
function btn(label,action,variant='btn-ghost',extra=''){return `<button class="btn ${variant}" data-action="${action}" ${extra}>${label}</button>`;}
function badge(status){const map={pending:['À effectuer','amber'],declared:['Déclarée · en attente','blue'],verified:['Vérifiée','green'],issue:['Écart déclaré','red'],removed:['Retrait vérifié','muted']};const [text,css]=map[status]||map.pending;return `<span class="pill ${css}">${text}</span>`;}
function statusOf(p){if(state.phase==='depose'||state.phase==='terminee')return C.getDeposeState(p);return C.getPoseState(p);}
function actionOf(p){if(state.phase==='pose')return C.canPose(p,state.phase,currentUser)?'pose':null;if(state.phase==='depose')return C.canDepose(p,state.phase,currentUser)?'depose':null;return null;}
function pageTitle(sub,txt,actions=''){return `<div class="page-heading"><div><div class="eyebrow">ENVIRONNEMENT DE DÉMONSTRATION · DONNÉES FICTIVES</div><h1>${esc(txt)}</h1><p>${sub}</p></div><div class="heading-actions">${actions}</div></div>`;}
function phaseText(){return {preparation:'Plan en préparation',pose:'Suivi des poses',depose:'Suivi des retraits',terminee:'Suivi clôturé (démo)'}[state.phase];}
function phasePill(){return `<span class="pill ${state.phase==='terminee'?'green':state.phase==='pose'?'blue':state.phase==='depose'?'purple':'amber'}">${esc(phaseText())}</span>`;}
function progressHTML(value,max,color='#248d80'){const percent=max?100*value/max:0;return `<div class="progress-bar"><span class="bar" style="width:${percent}%;background:${color}"></span></div>`;}
function allVerifiedExplanation(){const c=C.counts(state.points);return `${c.poseVerified}/${c.total} protections recollées · ${c.removeVerified}/${c.total} retraits recollés.`;}

function render(){
 doc.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 const mine=state.points.filter(p=>p.agent===currentUser).length;
 el('nav-mine-count').textContent=String(mine);
 const views={dashboard:renderDashboard,plan:renderPlan,mine:renderMine,review:renderReview,messages:renderMessages,settings:renderSettings};
 listEl.innerHTML=(views[view]||renderDashboard)();
 if(view==='plan'){const board=el('plan-board');if(board){board.style.width=zoomWidth+'px';board.style.aspectRatio=String(state.imgRatio||1718/755);}const bg=el('plan-image');if(bg)bg.src=imgURL;}
 hydratePhotos();
}
function renderDashboard(){
 const c=C.counts(state.points);
 const last=state.events[0];
 return pageTitle('Vue opérationnelle des protections électriques','Bonjour, '+(isChef()?'responsable du perchage':name(currentUser).split(' ')[0]),`${btn('⌗ Ouvrir le plan','nav-plan','btn-primary')}<a href="./concepteur.html" class="btn btn-soft">✎ Concevoir un plan</a>`)+`
 <section class="hero-card"><div class="hero-content"><div class="hero-mini">◉ SUIVI DES PROTECTIONS ÉLECTRIQUES</div><h2>Chaque perche suivie.<br>Chaque étape tracée.</h2><p>Du plan initial au recollement de chaque protection, retrouvez toutes les informations au même endroit. Prototype de formation sans valeur opérationnelle.</p><div class="hero-tags"><span>⌗ Schéma S11</span><span>◉ ${esc(phaseText())}</span><span>◷ Mise à jour locale</span></div></div><div class="hero-illustration" aria-hidden="true">⌁</div></section>
 <div class="dashboard-stats">
  <div class="card stat"><div class="stat-label">Connexions planifiées</div><div class="stat-value">${c.total}</div><div class="stat-icon">⌗</div><div class="stat-foot">Repères de démonstration</div></div>
  <div class="card stat"><div class="stat-label">Poses déclarées</div><div class="stat-value">${c.posed}<span> / ${c.total}</span></div><div class="stat-icon">↥</div><div class="stat-foot">Déclaration de l'agent</div></div>
  <div class="card stat"><div class="stat-label">Poses recollées</div><div class="stat-value">${c.poseVerified}<span> / ${c.total}</span></div><div class="stat-icon">✓</div><div class="stat-foot">Contrôle distinct</div></div>
  <div class="card stat"><div class="stat-label">Retraits recollés</div><div class="stat-value">${c.removeVerified}<span> / ${c.total}</span></div><div class="stat-icon">↧</div><div class="stat-foot">Avant vérification finale</div></div>
 </div>
 <div class="dashboard-grid">
  <section class="card section-card"><div class="section-card-header"><div><h2>Avancement de l'opération</h2><p>Statuts déclaratifs de la démonstration</p></div>${phasePill()}</div>
   <div class="mini-heading">POSES RECOLLÉES</div>${progressHTML(c.poseVerified,c.total)}<div class="progress-legend"><span><b style="background:#21a981"></b>${c.poseVerified} vérifiées</span><span><b style="background:#e5a83d"></b>${c.total-c.poseVerified} non vérifiées</span></div>
   <div class="mini-heading" style="margin-top:24px">RETRAITS RECOLLÉS</div>${progressHTML(c.removeVerified,c.total,'#588eb1')}<div class="progress-legend"><span><b style="background:#588eb1"></b>${c.removeVerified} vérifiés</span><span><b style="background:#e5a83d"></b>${c.total-c.removeVerified} non vérifiés</span></div>
   <div class="divider"></div>
   <div class="workflow"><div class="workflow-index ${state.phase!=='preparation'?'done':'active'}">${state.phase==='preparation'?'1':'✓'}</div><div class="workflow-info"><strong>01. Plan et affectations</strong><small>Repères et intervenants, à confirmer sur le plan officiel</small></div></div>
   <div class="workflow"><div class="workflow-index ${['depose','terminee'].includes(state.phase)?'done':state.phase==='pose'?'active':''}">${['depose','terminee'].includes(state.phase)?'✓':'2'}</div><div class="workflow-info"><strong>02. Pose et recollement</strong><small>Attestations terrain, photos, contrôle par le responsable</small></div></div>
   <div class="workflow"><div class="workflow-index ${state.phase==='terminee'?'done':state.phase==='depose'?'active':''}">${state.phase==='terminee'?'✓':'3'}</div><div class="workflow-info"><strong>03. Retrait et bilan</strong><small>Aucune déclaration ne vaut restitution officielle</small></div></div>
   ${dashboardPhaseAction()}
  </section>
  <section class="card section-card"><div class="section-card-header"><div><h2>Accès rapides</h2><p>Des actions pensées pour le terrain</p></div></div><div class="quick-actions">
   <button class="quick-action" data-action="nav-plan"><span class="qa-icon">⌗</span><span><strong>Visualiser le plan</strong><small>${c.total} repères sur le schéma</small></span><span class="qa-arrow">›</span></button>
   <button class="quick-action" data-action="nav-mine"><span class="qa-icon">◇</span><span><strong>Mes perches</strong><small>Vérifications et photos</small></span><span class="qa-arrow">›</span></button>
   <button class="quick-action" data-action="nav-review"><span class="qa-icon">◎</span><span><strong>Contrôler le recollement</strong><small>${Math.max(0,c.posed-c.poseVerified)} pose(s) à examiner</small></span><span class="qa-arrow">›</span></button>
   <button class="quick-action" data-action="nav-messages"><span class="qa-icon">↗</span><span><strong>Préparer une transmission</strong><small>Brouillons de compte-rendu uniquement</small></span><span class="qa-arrow">›</span></button>
  </div><div class="divider"></div><div class="mini-heading">DERNIER ÉVÉNEMENT</div><p class="note" style="margin:8px 0 0">${last?`${esc(last.detail)} · ${formatTime(last.at)}`:'Aucun événement'}</p></section>
 </div>`;
}
function dashboardPhaseAction(){
 if(!isChef())return `<div class="divider"></div><div class="note">Les changements de phase de la démonstration sont réservés au profil responsable.</div>`;
 if(state.phase==='preparation')return `<div class="button-row" style="margin-top:20px">${btn('Démarrer la simulation de pose','begin-pose','btn-primary')}</div>`;
 if(state.phase==='pose')return `<div class="button-row" style="margin-top:20px">${btn('Passer aux retraits simulés','begin-depose','btn-primary',C.canOpenDepose(state.points,state.phase)?'':'disabled')}${!C.canOpenDepose(state.points,state.phase)?'<span class="note">Toutes les poses doivent être recollées.</span>':''}</div>`;
 if(state.phase==='depose')return `<div class="button-row" style="margin-top:20px">${btn('Clôturer le suivi de démonstration','close-demo','btn-primary',C.canClose(state.points,state.phase)?'':'disabled')}${!C.canClose(state.points,state.phase)?'<span class="note">Tous les retraits doivent être recollés.</span>':''}</div>`;
 return `<div class="success-strip" style="margin-top:20px">Suivi de démonstration terminé. La restitution officielle reste en dehors de CATÉNA.</div>`;
}
function renderPlan(){
 const c=C.counts(state.points);const p=selectedPoint();
 return pageTitle('Un symbole = une connexion = un suivi nominatif','Plan interactif',`${btn('Mes perches','nav-mine','btn-ghost')}${isChef()?btn('Éditer le plan','nav-settings','btn-primary'):''}`)+`
 <div class="operation-bar">${phasePill()}<span class="badge">${c.total} symboles</span><span class="badge">${c.poseVerified} poses recollées</span><span class="badge">${c.removeVerified} retraits recollés</span></div>
 <div class="plan-layout"><div class="plan-panel">
 <div class="plan-toolbar"><div class="plan-toolbar-left"><strong>⌗ CATÉNA · Schéma pédagogique fictif</strong><span class="subtle">Symboles illustratifs</span></div><div class="plan-toolbar-right"><button class="btn btn-icon" data-action="zoom-out" aria-label="Zoom arrière">−</button><span class="pill muted" id="zoom-level">${Math.round(zoomWidth/1150*100)} %</span><button class="btn btn-icon" data-action="zoom-in" aria-label="Zoom avant">+</button></div></div>
 <div class="plan-viewport" id="plan-viewport"><div class="plan-board" id="plan-board"><img class="plan-background" alt="Schéma pédagogique fictif sans données de chantier" id="plan-image"><div class="plan-watermark">DÉMONSTRATION FICTIVE — AUCUNE VALEUR TECHNIQUE</div><div class="pin-layer">${state.points.map(q=>`<button class="plan-pin ${q.agent===currentUser&&['pose','depose'].includes(state.phase)?'mine':''} ${p?.uid===q.uid?'selected':''} ${state.phase==='preparation'&&isChef()?'editable':'locked'}" data-action="select-pin" data-uid="${esc(q.uid)}" data-status="${statusOf(q)}" style="left:${q.x}%;top:${q.y}%" title="${esc(`Connexion ${q.number} · ${q.voie} · ${name(q.agent)}`)}" aria-label="Connexion ${esc(q.number)}, ${esc(statusOf(q))}">${esc(q.number)}<span class="pin-symbol" aria-hidden="true">${esc(symbolInfo(q.symbol)[1])}</span></button>`).join('')}</div></div></div>
 <div class="plan-bottom"><div class="legend"><span class="legend-item"><i class="legend-dot"></i> À faire</span><span class="legend-item"><i class="legend-dot declared"></i> Déclarée</span><span class="legend-item"><i class="legend-dot verified"></i> Vérifiée</span><span class="legend-item"><i class="legend-dot issue"></i> Écart</span><span class="legend-item"><i class="legend-dot removed"></i> Retirée</span></div><span class="note">Défilement horizontal et zoom disponibles.</span></div><div class="symbol-legend">${SYMBOLS.map(s=>`<span><b>${esc(s[1])}</b> ${esc(s[2])}</span>`).join('')}</div>
 ${state.phase==='preparation'&&isChef()?`<div class="card card-pad" style="margin-top:9px"><div class="section-card-header"><div><h3 style="margin:0">Placer des symboles</h3><p>En mode édition, toucher le schéma pour créer une connexion.</p></div>${btn(placement?'Annuler le placement':'＋ Ajouter un symbole','toggle-placement',placement?'btn-danger':'btn-soft')}</div><p class="note" style="margin:0">${placement?'Mode placement actif : touchez un emplacement sur le plan.':'Déplacez les symboles existants par glisser-déposer. Positions provisoires importées de l’exemple.'}</p></div>`:''}
 </div>
 <aside class="plan-side">${p?renderPointDetail(p):`<div class="card side-detail">Aucune connexion sélectionnée.</div>`}</aside></div>`;
}
function renderPointDetail(p){
 const mode=state.phase==='depose'||state.phase==='terminee'?'depose':'pose';
 const datum=p[mode];
 const action=actionOf(p);
 return `<div class="card side-detail"><div class="ref">REPÈRE SÉLECTIONNÉ</div><div class="big-ref">Connexion ${esc(p.number)}</div>${badge(statusOf(p))}<div class="info-grid"><div><div class="info-caption">Voie</div><strong>${esc(p.voie)}</strong></div><div><div class="info-caption">Support</div><strong>${esc(p.support||'À renseigner')}</strong></div><div><div class="info-caption">Équipement</div><strong>${esc(p.type)}</strong></div><div><div class="info-caption">Symbole du plan</div><strong>${esc(symbolInfo(p.symbol)[2])}</strong></div><div><div class="info-caption">Agent affecté</div><strong>${esc(name(p.agent))}</strong></div><div><div class="info-caption">Drapeau / lampe bleue</div><strong>${p.flag?'Prévu dans l’exercice':'Non indiqué'}</strong></div><div><div class="info-caption">Dernière attestation</div><strong>${datum?.at?formatTime(datum.at):'Aucune'}</strong></div></div>
 <div class="side-separator"></div><div class="button-row">${action?btn(`${mode==='pose'?'↥ Déclarer la pose':'↧ Déclarer le retrait'}`,'do-point','btn-primary',`data-uid="${esc(p.uid)}"`):''}${isChef()&&state.phase==='preparation'?btn('Modifier / affecter','edit-point','btn-primary',`data-uid="${esc(p.uid)}"`):''}${isChef()&&(state.phase==='pose'||state.phase==='depose')?btn('Voir au recollement','nav-review','btn-soft'):''}${!action&&state.phase!=='preparation'?'<small class="note">Actions disponibles uniquement pour l’agent affecté et dans la phase concernée.</small>':''}</div>
 <div class="detail-footer"><p>◉ <strong>Une photo ne prouve pas seule la bonne exécution.</strong> La déclaration de l'agent et le contrôle indépendant sont distingués.</p></div></div>`;
}
function renderMine(){
 const mine=state.points.filter(p=>p.agent===currentUser);
 const items=isChef()?state.points:mine;
 const stage=state.phase==='depose'||state.phase==='terminee'?'depose':'pose';
 const ready=items.filter(p=>C.canPose(p,state.phase,currentUser)||C.canDepose(p,state.phase,currentUser)).length;
 return pageTitle(isChef()?'Vue globale : connectez-vous comme agent pour tester les attestations.':`${mine.length} connexion(s) affectée(s) · ${ready} à traiter`,'Mes perches',`${btn('⌗ Voir sur le plan','nav-plan','btn-primary')}`)+`
 <div class="list-layout"><div class="list-stack">${items.length?items.map(p=>{
  const action=actionOf(p);
  return `<div class="card point-row"><div class="point-emblem">${esc(p.number)}</div><div class="point-main"><strong>Connexion ${esc(p.number)} · ${esc(p.voie)}</strong><small>${esc(p.type)} · Support ${esc(p.support)} · ${esc(name(p.agent))}</small></div><div class="actions">${badge(statusOf(p))}${action?btn(stage==='pose'?'Déclarer la pose':'Déclarer le retrait','do-point','btn-primary btn-sm',`data-uid="${esc(p.uid)}"`):btn('Voir','focus-point','btn-ghost btn-sm',`data-uid="${esc(p.uid)}"`)}</div></div>`;
 }).join(''):`<div class="empty-state"><span class="empty-icon">◇</span><h3>Aucune connexion affectée</h3><p>Le responsable peut modifier les affectations en phase de préparation.</p></div>`}</div>
 <aside class="card helper-card"><div class="mini-heading">MODE OPÉRATOIRE DANS L'APPLICATION</div><h3 style="margin-top:11px">Une déclaration en quelques gestes</h3><p>Depuis la fiche de la connexion, l'agent retrouve les vérifications à attester et joint une photo. Les procédures de terrain restent celles de son employeur.</p><ol><li>Repérer le numéro sur le schéma approuvé</li><li>Effectuer les opérations selon prescriptions</li><li>Renseigner les attestations demandées</li><li>Photographier et déclarer</li><li>Attendre le recollement du responsable</li></ol><div class="divider"></div><p class="note warning">⚠ Aucune étape de cette démonstration n'autorise une action physique sur la caténaire.</p></aside></div>`;
}
function renderReview(){
 const c=C.counts(state.points);const stage=state.phase==='depose'||state.phase==='terminee'?'depose':'pose';
 const all=state.points.filter(p=>p[stage]?.declared),unreviewed=all.filter(p=>!p[stage]?.verified);
 return pageTitle('Validation distincte de l’attestation de l’agent','Recollement des protections',`${btn('⌗ Contrôler le plan','nav-plan','btn-ghost')}`)+`
 <div class="card review-overview"><div class="big-circle">${stage==='pose'?c.poseVerified:c.removeVerified}</div><div><h3>${stage==='pose'?'Poses':'Retraits'} recollé(e)s sur ${c.total}</h3><p>${unreviewed.length} déclaration(s) à examiner. ${state.points.length-all.length} connexion(s) sans déclaration.</p></div><div style="margin-left:auto">${phasePill()}</div></div>
 ${c.issues?`<div class="issue-strip">⚠ ${c.issues} connexion(s) comportent une anomalie ou réserve. Les étapes suivantes restent bloquées tant que les écarts ne sont pas levés et revérifiés.</div>`:''}
 ${C.canOpenDepose(state.points,state.phase)?`<div class="success-strip">Toutes les poses sont recollées dans la simulation. Cela ne constitue pas une autorisation d'engager les travaux ni de déposer les protections.</div>`:''}
 ${C.canClose(state.points,state.phase)?`<div class="success-strip">Tous les retraits sont recollés dans la simulation. Vérification officielle et restitution documentaire toujours indispensables.</div>`:''}
 <div class="card section-card"><div class="section-card-header"><div><h2>Contrôle connexion par connexion</h2><p>Recollement réalisé par un acteur différent du déclarant</p></div><span class="pill muted">${all.length} reçue(s)</span></div><div class="review-list">${state.points.map(p=>{
 const info=p[stage];const can=isChef()&&(stage==='pose'?C.canReviewPose(p,state.phase,currentUser):C.canReviewDepose(p,state.phase,currentUser));
 return `<div class="review-row"><div class="${info?.photoKey?'photo-empty':'photo-empty'}" data-thumb="${info?.photoKey?esc(info.photoKey):''}">${info?.photoKey?'▧':'◇'}</div><div class="review-text"><strong>${esc(p.number)} · ${esc(p.voie)} · ${esc(p.support)} · ${esc(p.type)}</strong><span>${info?.declared?`Déclaré par ${esc(name(info.actor))} le ${formatTime(info.at)}`:'En attente de déclaration de l’agent'}${info?.verified?` · Vérifié par ${esc(name(info.reviewer))}`:''}</span></div><div class="review-buttons">${badge(statusOf(p))}${can?btn('Examiner','review-point','btn-primary btn-sm',`data-uid="${esc(p.uid)}"`):''}${info?.photoKey?btn('Photo','view-photo','btn-ghost btn-sm',`data-key="${esc(info.photoKey)}"`):''}</div></div>`;
 }).join('')}</div></div>
 ${isChef()?`<div class="button-row" style="margin-top:18px">${state.phase==='pose'?btn('Passer aux retraits (simulation)','begin-depose','btn-primary',C.canOpenDepose(state.points,state.phase)?'':'disabled'):''}${state.phase==='depose'?btn('Clôturer le suivi (simulation)','close-demo','btn-primary',C.canClose(state.points,state.phase)?'':'disabled'):''}</div>`:'<div class="note" style="margin-top:15px">Connectez-vous au profil Responsable pour simuler le recollement.</div>'}`;
}
function messageText(){
 const c=C.counts(state.points),d=new Date().toLocaleString('fr-FR');const labels={pose:'Notification des poses',reco:'État de recollement',depose:'Notification des retraits',incident:'Signalement d’écart'};
 const first=`BROUILLON NON OFFICIEL — NE VAUT PAS DÉPÊCHE NI AUTORISATION\nCATÉNA · Exercice fictif · Sans valeur opérationnelle\nÉtabli le ${d} par ${name(currentUser)}\nType : ${labels[activeTemplate]}\n`;
 let body='';
 if(activeTemplate==='pose'){body=`Poses déclarées : ${c.posed}/${c.total}.\nRepères : ${state.points.filter(p=>p.pose?.declared).map(p=>p.number).join(', ')||'aucun'}.\nPoses recollées : ${c.poseVerified}/${c.total}.`;}
 if(activeTemplate==='reco'){body=`Poses recollées : ${c.poseVerified}/${c.total}.\nRetraits recollés : ${c.removeVerified}/${c.total}.\nÉcarts : ${c.issues}.\nConnexions en attente : ${state.points.filter(p=>!p.pose?.verified).map(p=>p.number).join(', ')||'aucune'}.`;}
 if(activeTemplate==='depose'){body=`Retraits déclarés : ${c.removed}/${c.total}.\nRetraits recollés : ${c.removeVerified}/${c.total}.\nConnexions à contrôler : ${state.points.filter(p=>!p.depose?.verified).map(p=>p.number).join(', ')||'aucune'}.`;}
 if(activeTemplate==='incident'){body=`Anomalies : ${c.issues}.\nConnexions concernées : ${state.points.filter(p=>p.pose?.issue||p.depose?.issue).map(p=>p.number).join(', ')||'aucune'}.\nLes opérations doivent rester soumises aux consignes et circuits d’autorisation applicables.`;}
 return first+'\n'+body+'\n\nDiffusion uniquement par le moyen officiel habilité, selon les prescriptions applicables.';
}
function renderMessages(){
 return pageTitle('Brouillons prêts à copier ; envoi officiel non disponible','Transmissions et historique',`${btn('↓ Exporter l’historique','export-csv','btn-primary')}`)+`
 <div class="message-board"><section class="card section-card"><div class="section-card-header"><div><h2>Journal horodaté</h2><p>Historique local indicatif, modifiable sur cet appareil</p></div><span class="pill muted">${state.events.length} événement(s)</span></div><div class="timeline">${state.events.slice(0,70).map(ev=>`<div class="event"><div class="event-icon">${eventIcon(ev.kind)}</div><div class="event-body"><div class="event-top"><strong>${esc(eventLabel(ev.kind))}${ev.number?` · ${esc(ev.number)}`:''}</strong><time>${formatTime(ev.at)}</time></div><p>${esc(ev.detail)}</p><div class="event-by">${esc(name(ev.actor))}</div></div></div>`).join('')}</div></section>
 <aside class="card section-card"><div class="section-card-header"><div><h2>Préparer un compte-rendu</h2><p>Sans émission de dépêche officielle</p></div></div><div class="template-options">
 ${[['pose','↥','Notification de poses','État des déclarations de pose'],['reco','◎','Recollement','Bilan des validations'],['depose','↧','Notification de déposes','État des retraits'],['incident','!','Signaler un écart','Remontée des anomalies']].map(x=>`<button class="template-button ${activeTemplate===x[0]?'active':''}" data-action="template" data-template="${x[0]}"><span>${x[1]}</span><div><strong>${x[2]}</strong><small>${x[3]}</small></div></button>`).join('')}
 </div><div class="divider"></div><div class="memo-box" id="memo-box">${esc(messageText())}</div><div style="margin-top:12px">${btn('Copier le brouillon','copy-message','btn-primary btn-block')}</div><p class="note warning" style="margin-top:13px">Le protocole de dépêche authentifié, les accusés de réception, les numéros donnés/reçus et l'horodatage serveur nécessitent une intégration approuvée par l'exploitant.</p></aside></div>`;
}
function eventLabel(kind){return {import:'Plan de travail préparé',openpose:'Simulation de pose ouverte',pose:'Pose déclarée',poseOK:'Pose recollée',poseIssue:'Écart sur pose',opendepose:'Simulation de dépose ouverte',depose:'Retrait déclaré',deposeOK:'Retrait recollé',deposeIssue:'Écart sur retrait',close:'Suivi clôturé',add:'Symbole ajouté',update:'Connexion modifiée',delete:'Symbole retiré du plan',plan:'Schéma remplacé'}[kind]||'Événement';}
function eventIcon(kind){return {pose:'↥',poseOK:'✓',depose:'↧',deposeOK:'✓',poseIssue:'!',deposeIssue:'!',import:'⌗',add:'＋',update:'✎',plan:'⌗',close:'●'}[kind]||'◉';}
function renderSettings(){
 return pageTitle('Modifiez le plan avant d’ouvrir une session de démonstration','Préparer le plan',`${btn('⌗ Visualiser le schéma','nav-plan','btn-primary')}`)+`
 <div class="settings-grid"><div class="card settings-card"><h2>Le schéma de base</h2><p>Importez une capture S11, puis positionnez les symboles sur le plan. Un schéma fictif est chargé par défaut ; aucune donnée réelle n’est publiée.</p>
 <div class="readonly-description"><b>Source :</b> ${esc(state.planName)}<br><b>Références :</b> Plan fictif de formation<br><b>Statut :</b> ${state.planLocked?'Plan figé après ouverture de la simulation':'Ébauche à vérifier'}<br><b>Important :</b> capture et coordonnées non validées pour exploitation.</div>
 <div class="form-field"><label for="plan-upload">Importer une image de fond (PNG/JPEG)</label><input class="input" type="file" id="plan-upload" accept="image/png,image/jpeg,image/webp" ${(!isChef()||state.planLocked)?'disabled':''}/><small>Les symboles restent à leur emplacement en pourcentage ; repositionnez-les ensuite si vous changez d’image.</small></div>
 <div class="button-row">${btn('Ajouter un repère sur le plan','add-from-settings','btn-soft',(!isChef()||state.planLocked)?'disabled':'')}${btn('↓ Exporter les données démo','export-json','btn-ghost')}</div>
 <div class="divider"></div><h2>Reprise de la démonstration</h2><p>Ces fichiers ne sont ni des plans officiellement validés ni des preuves de transmission sécurisée.</p>
 <div class="form-field"><label for="import-json">Restaurer un export JSON de cette démo</label><input type="file" class="input" id="import-json" accept="application/json,.json" /></div><div class="button-row">${btn('↺ Réinitialiser la démo','reset-demo','btn-danger')}</div>
 </div><div class="card settings-card"><div class="section-card-header"><div><h2>Connexions du plan (${state.points.length})</h2><p>Numéro, voie, support, matériel, agent</p></div>${phasePill()}</div>
 <div>${state.points.map(p=>`<div class="edit-point-row"><div class="point-emblem" style="width:43px;height:43px;flex-basis:43px">${esc(p.number)}</div><div><strong>${esc(p.voie)} · ${esc(p.type)}</strong><small>${esc(p.support)} · ${esc(name(p.agent))}</small></div><div class="edit-tools">${btn('Modifier','edit-point','btn-ghost btn-sm',`data-uid="${esc(p.uid)}" ${state.planLocked||!isChef()?'disabled':''}`)}</div></div>`).join('')}</div>
 <div class="divider"></div><div class="note warning">Les habilitations, autorisations, rôles et circuits de contrôle doivent être paramétrés puis validés avant toute utilisation réelle.</div></div></div>`;
}

// Local photograph store. IndexedDB is NOT secure storage; this demo must not be used with real evidence.
function openDatabase(){return new Promise((resolve,reject)=>{
 if(!('indexedDB' in window))return reject(new Error('Stockage local des photos indisponible'));
 const req=indexedDB.open(DB_NAME,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images');};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
function storeImage(key,value){return new Promise((resolve,reject)=>{
 if(!db)return reject(new Error('IndexedDB indisponible'));
 const tx=db.transaction('images','readwrite');tx.objectStore('images').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
});}
function fetchImage(key){return new Promise((resolve,reject)=>{
 if(!db)return resolve(null);
 const req=db.transaction('images','readonly').objectStore('images').get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
});}
function clearImages(){return new Promise((resolve,reject)=>{
 if(!db)return resolve();const tx=db.transaction('images','readwrite');tx.objectStore('images').clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
});}
async function hydratePhotos(){
 for(const box of doc.querySelectorAll('[data-thumb]')){
   const key=box.getAttribute('data-thumb');if(!key)continue;
   const data=await fetchImage(key).catch(()=>null);
   if(data&&box.isConnected){const img=doc.createElement('img');img.className='photo-mini';img.src=data;img.alt='Photo déclarative associée à la connexion';box.replaceWith(img);}
 }
 for(const image of doc.querySelectorAll('img[data-photo-key]')){
   const k=image.dataset.photoKey;const data=await fetchImage(k).catch(()=>null);if(data&&image.isConnected)image.src=data;
 }
}
function imageAsDataURL(file,maxWidth=1400,quality=.77){return new Promise((resolve,reject)=>{
 if(!file||!file.type.startsWith('image/')||file.size>25_000_000)return reject(new Error('Sélectionnez une image JPG/PNG/WEBP de moins de 25 Mo.'));
 const reader=new FileReader();reader.onerror=()=>reject(new Error('Lecture de photo impossible'));
 reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('Image illisible'));image.onload=()=>{
  try{
   const ratio=Math.min(1,maxWidth/image.width);
   const w=Math.max(1,Math.round(image.width*ratio)),h=Math.max(1,Math.round(image.height*ratio));
   const canvas=doc.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,w,h);
   const data=canvas.toDataURL('image/jpeg',quality);resolve({data,ratio:w/h});
  }catch(e){reject(e);}
 };image.src=reader.result;};reader.readAsDataURL(file);
});}
function downloadBlob(filename,mime,text){const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=doc.createElement('a');a.href=url;a.download=filename;a.style.display='none';doc.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1500);}
function filenameDate(){return new Date().toISOString().slice(0,10);}
function csv(v){return `"${String(v??'').replace(/"/g,'""')}"`;}
function exportEventsCSV(){const head=['Date serveur (non vérifiée)','Événement','Connexion','Utilisateur (démo)','Détails','Référence photo locale'];const rows=state.events.slice().reverse().map(x=>[x.at,eventLabel(x.kind),x.number||'',name(x.actor),x.detail,x.photoKey||'']);const data=[head,...rows].map(row=>row.map(csv).join(';')).join('\r\n');downloadBlob(`CATENA_Journal_demo_${filenameDate()}.csv`,'text/csv;charset=utf-8','\ufeff'+data);toast('Historique CSV exporté (données locales non certifiées).');}
async function exportDemoJSON(){
 const keys=new Set([...state.points.flatMap(p=>[p.pose?.photoKey,p.depose?.photoKey]),...state.events.map(e=>e.photoKey),state.customPlan?'plan_custom':''].filter(Boolean));
 const images={};for(const key of keys){const value=await fetchImage(key).catch(()=>null);if(value)images[key]=value;}
 const payload={_catena:'export-local-demo-0.1.0',exported:stamp(),state,images};
 downloadBlob(`CATENA_Sauvegarde_demo_${filenameDate()}.json`,'application/json;charset=utf-8',JSON.stringify(payload,null,2));toast('Export JSON créé (sans garantie de conservation).');
}
async function restoreDemoJSON(file){
 if(!file||file.size>40_000_000)throw new Error('Fichier JSON trop volumineux.');
 const raw=JSON.parse(await file.text());
 if(raw._catena!=='export-local-demo-0.1.0'||!raw.state||!Array.isArray(raw.state.points)||raw.state.points.length>300||!Array.isArray(raw.state.events)||raw.state.events.length>10000||!['preparation','pose','depose','terminee'].includes(raw.state.phase))throw new Error('Format de sauvegarde incompatible.');
 for(const item of raw.state.points){if(!item.uid||!item.number||!Number.isFinite(item.x)||!Number.isFinite(item.y)||item.x<0||item.x>100||item.y<0||item.y>100)throw new Error('Repère invalide dans le fichier.');}
 for(const [key,value] of Object.entries(raw.images||{})){if(typeof value==='string'&&value.startsWith('data:image/')&&value.length<8_000_000)await storeImage(key,value);}
 state=raw.state;imgURL=state.customPlan?(await fetchImage('plan_custom').catch(()=>null))||'assets/schema_demo.png':'assets/schema_demo.png';selected=state.points[0]?.uid||'';view='dashboard';apply();toast('Démonstration restaurée.');
}

function modal(title,sub,body,footer=''){modalRoot.innerHTML=`<div class="modal-backdrop" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${title}</h2><small>${sub}</small></div><button class="modal-close" data-dismiss="true" aria-label="Fermer">×</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-foot">${footer}</div>`:''}</div></div>`;const first=modalRoot.querySelector('input,button,select');if(first)first.focus({preventScroll:true});hydratePhotos();}
function closeModal(){modalRoot.innerHTML='';photoBuffer=null;}
function confirmOnly(title,body,button,callback,checkboxLabel='Je confirme qu’il s’agit uniquement d’une simulation.'){
 modal(title,'Aucune opération officielle déclenchée',`<div class="modal-warning"><strong>PROTOCOLE OFFICIEL INCHANGÉ.</strong> L’application n’autorise aucun travail, aucune intervention électrique ni restitution d’ARF.</div><p class="note">${body}</p><label class="check-row attest"><input type="checkbox" id="modal-confirm-check">${esc(checkboxLabel)}</label>`,`${btn('Annuler','modal-cancel','btn-ghost')}<button class="btn btn-primary" id="modal-action-confirm">${esc(button)}</button>`);
 el('modal-action-confirm').addEventListener('click',()=>{if(!el('modal-confirm-check').checked)return toast('Cochez la confirmation de démonstration.','error');callback();closeModal();apply();});
}
function beginPose(){if(!isChef()||state.phase!=='preparation')return toast('Phase ou rôle non autorisé.','error');
 confirmOnly('Démarrer la pose de démonstration','Les repères et affectations de ce plan pédagogique sont entièrement fictifs. Cette commande ouvre la saisie fictive des agents.','Ouvrir la simulation',()=>{state.phase='pose';state.planLocked=true;placement=false;log('openpose',null,'Suivi fictif des poses activé. Aucune autorisation opérationnelle réelle.');});
}
function beginDepose(){if(!isChef()||!C.canOpenDepose(state.points,state.phase))return toast('Toutes les poses doivent être recollées au préalable.','error');
 modal('Simuler l’ouverture des retraits','Phase distincte de la pose',`<div class="modal-warning"><strong>Attention :</strong> avant toute dépose physique, l’autorisation officielle appropriée reste indispensable. Ce champ n’en constitue pas la preuve.</div><form id="form-phase-depose"><div class="form-field"><label for="reference-depose">Référence d’échange externe (simulation)</label><input class="input" id="reference-depose" maxlength="100" placeholder="Ex. DÉMO — référence de dossier" required></div><label class="check-row attest"><input type="checkbox" id="depose-confirm" required>Je confirme ne déclencher ici qu'une simulation sans valeur de dépêche.</label><div class="button-row" style="justify-content:flex-end;margin-top:15px"><button class="btn btn-ghost" type="button" data-action="modal-cancel">Annuler</button><button class="btn btn-primary" type="submit">Ouvrir les retraits simulés</button></div></form>`);
 el('form-phase-depose').addEventListener('submit',ev=>{ev.preventDefault();if(!el('depose-confirm').checked)return;state.removalRef=el('reference-depose').value.trim();if(!state.removalRef)return;state.phase='depose';log('opendepose',null,`Retrait en démonstration ouvert. Référence simulée : ${state.removalRef}`);closeModal();apply();});
}
function closeDemo(){if(!isChef()||!C.canClose(state.points,state.phase))return toast('Clôture bloquée : un retrait n’est pas recollé.','error');
 confirmOnly('Clôturer le suivi de démonstration',`Les ${state.points.length} retraits ont été recollés dans la démonstration. CATÉNA ne restitue ni voie, ni ARF, ni consignation.`,`Clôturer la démonstration`,()=>{state.phase='terminee';state.closedAt=stamp();log('close',null,'Tous les retraits déclaratifs sont recollés en démonstration. Restitution documentaire extérieure non effectuée.');},'Je comprends que cette clôture ne constitue pas une restitution officielle de protection électrique.');
}
function attestationModal(p,mode){
 if(!p)return;
 if(!(mode==='pose'?C.canPose(p,state.phase,currentUser):C.canDepose(p,state.phase,currentUser)))return toast('Action réservée à l’agent affecté pendant la bonne phase.','error');
 photoBuffer=null;
 const pose=mode==='pose';
 const checks=pose?[
  ['precheck','Dispositif de VAT : contrôle de bon fonctionnement préalable effectué'],
  ['vat','Vérification d’absence de tension (VAT) réalisée selon les consignes applicables'],
  ['postcheck','Dispositif de VAT : contrôle de bon fonctionnement après utilisation effectué'],
  ['fixing','Connexion de protection / perche mise en place conformément au plan autorisé'],
  ['location','Repère, voie et support du point concerné vérifiés sur le terrain']
 ]:[
  ['removed','Retrait de la connexion de protection déclaré effectué conformément aux consignes'],
  ['siteClear','Contrôle visuel du point effectué, absence de la connexion sur ce point déclarée']
 ];
 const note=pose?'Effectuez les opérations sur le terrain uniquement dans le cadre des prescriptions de l’employeur et des autorisations officielles. La photo ne remplace pas les contrôles.':'Le retrait ne peut être engagé que dans le cadre de la procédure officielle de dépose et de restitution. Une photo ne démontre pas à elle seule la libération complète de l’installation.';
 modal(pose?`Déclarer la pose · ${esc(p.number)}`:`Déclarer le retrait · ${esc(p.number)}`,`${esc(p.voie)} · Support ${esc(p.support)} · ${esc(p.type)}`,`<div class="readonly-description"><b>Agent :</b> ${esc(name(currentUser))}<br><b>Point :</b> Connexion ${esc(p.number)} · Voie ${esc(p.voie)} · ${esc(p.type)}</div><div class="modal-warning">${esc(note)}</div>
 <form id="attestation-form"><div class="step-label">01 · Vérifications déclaratives</div><label class="check-row"><input type="checkbox" id="check-authority" required>Je confirme intervenir dans le cadre d'une autorisation et de prescriptions officielles reçues par les voies prévues.</label><div class="checklist">${checks.map(([key,label])=>`<label class="check-row"><input type="checkbox" name="${key}" required>${esc(label)}</label>`).join('')}</div>
 <div class="step-label">02 · Photo du point</div><div class="photo-upload"><strong>▧ Photo du dispositif ${pose?'posé':'retiré'}</strong><p>Appareil photo ou galerie · l'image reste localement sur cet appareil dans la démonstration.</p><input type="file" id="evidence-image" accept="image/*" capture="environment" required><img id="photo-live-preview" class="photo-preview hidden" alt="Prévisualisation de la photo sélectionnée"></div>
 <div class="step-label">03 · Attestation personnelle</div><label class="check-row attest"><input type="checkbox" id="check-attest" required>Je déclare avoir personnellement réalisé les vérifications cochées et la ${pose?'mise en place':'dépose'} sur ce point.</label>
 <div class="form-field" style="margin-top:15px"><label for="attestation-comment">Observation complémentaire (facultative)</label><textarea id="attestation-comment" class="input" maxlength="700" rows="2" placeholder="Précisions utiles pour le responsable"></textarea></div><div class="modal-error hidden" id="attestation-error"></div>
 <div class="button-row" style="justify-content:flex-end"><button class="btn btn-ghost" type="button" data-action="modal-cancel">Annuler</button><button class="btn btn-primary" type="submit">${pose?'Déclarer la pose':'Déclarer le retrait'} (démo)</button></div></form>`);
 el('evidence-image').addEventListener('change',async ev=>{photoBuffer=null;el('photo-live-preview').classList.add('hidden');const file=ev.target.files?.[0];if(!file)return;
   try{photoBuffer=(await imageAsDataURL(file)).data;const im=el('photo-live-preview');im.src=photoBuffer;im.classList.remove('hidden');}catch(e){el('attestation-error').classList.remove('hidden');el('attestation-error').textContent=e.message;}
 });
 el('attestation-form').addEventListener('submit',async ev=>{ev.preventDefault();
  const form=ev.currentTarget;const checklist={};for(const [key] of checks)checklist[key]=form.elements.namedItem(key)?.checked===true;
  if(!el('check-authority').checked||!C.validateEvidence(mode,checklist,!!photoBuffer,el('check-attest').checked)){el('attestation-error').textContent='Toutes les attestations et une photo sont nécessaires.';el('attestation-error').classList.remove('hidden');return;}
  const key='photo-'+makeId();const submit=ev.submitter;submit.disabled=true;
  try{await storeImage(key,photoBuffer);}catch(e){submit.disabled=false;el('attestation-error').textContent='Impossible de conserver la photo localement. Déclaration refusée.';el('attestation-error').classList.remove('hidden');return;}
  // Re-evaluate permissions, including after asynchronous photo processing.
  if(!(pose?C.canPose(p,state.phase,currentUser):C.canDepose(p,state.phase,currentUser))){closeModal();return toast('Phase modifiée : opération abandonnée.','error');}
  const obs=el('attestation-comment').value.trim();p[mode]={declared:true,verified:false,issue:false,actor:currentUser,at:stamp(),photoKey:key,checks,observations:obs};
  log(mode,p.number,`${pose?'Pose':'Retrait'} déclarée par ${name(currentUser)}. Photo locale associée. ${obs}`.trim(),key);
  closeModal();apply();toast(`Connexion ${p.number} : ${pose?'pose':'retrait'} déclaré, en attente de recollement.`);
 });
}
function reviewModal(p){
 if(!p||!isChef())return toast('Recollement réservé au profil responsable.','error');
 const mode=state.phase==='depose'?'depose':'pose';
 if(!(mode==='pose'?C.canReviewPose(p,state.phase,currentUser):C.canReviewDepose(p,state.phase,currentUser)))return toast('Déclaration non recevable ou déjà contrôlée.','error');
 const evidence=p[mode];
 const checks=Object.keys(evidence.checks||{}).filter(k=>evidence.checks[k]);
 modal(`Recollement · ${esc(p.number)}`,'Validation par une personne distincte',`<div class="readonly-description"><b>Repère :</b> ${esc(p.number)} · ${esc(p.voie)} · ${esc(p.support)}<br><b>Déclarant :</b> ${esc(name(evidence.actor))}<br><b>Heure locale :</b> ${formatTime(evidence.at)}<br><b>Attestations :</b> ${checks.length} case(s) cochée(s)<br><b>Observations :</b> ${esc(evidence.observations||'Aucune')}</div>
 <div class="step-label">Preuve photographique déclarative</div><img class="photo-preview" alt="Photo du point soumise par l'agent" data-photo-key="${esc(evidence.photoKey)}"><div class="modal-warning">La photo doit être examinée avec les autres éléments du recollement. Ne valide pas automatiquement la sécurité électrique.</div>
 <form id="review-form"><label class="check-row attest"><input type="checkbox" id="review-confirm" required>J’atteste avoir contrôlé la cohérence des informations du point ${esc(p.number)} dans le cadre de cette simulation.</label><div class="form-field" style="margin-top:12px"><label for="review-comment">Note du responsable</label><textarea class="input" rows="2" maxlength="700" id="review-comment" placeholder="Concordance, anomalie ou précision"></textarea></div><div class="button-row" style="margin-top:15px"><button class="btn btn-danger" type="button" id="declare-issue">✕ Signaler un écart</button><button class="btn btn-success" type="submit">✓ Recollement validé (démo)</button></div></form>`);
 el('review-form').addEventListener('submit',ev=>{ev.preventDefault();if(!el('review-confirm').checked)return;if(evidence.actor===currentUser)return toast('Le déclarant ne peut pas être son propre relecteur.','error');
  evidence.verified=true;evidence.issue=false;evidence.reviewer=currentUser;evidence.reviewedAt=stamp();evidence.reviewComment=el('review-comment').value.trim();
  log(mode==='pose'?'poseOK':'deposeOK',p.number,`Recollement de ${mode} validé par ${name(currentUser)}. ${evidence.reviewComment||''}`.trim());closeModal();apply();toast(`Connexion ${p.number} : recollement enregistré dans la démo.`);
 });
 el('declare-issue').addEventListener('click',()=>{
  const note=el('review-comment').value.trim();if(!note)return toast('Indiquez la cause de l’écart dans la note.','error');
  evidence.verified=false;evidence.issue=true;evidence.reviewer=currentUser;evidence.reviewedAt=stamp();evidence.reviewComment=note;
  log(mode==='pose'?'poseIssue':'deposeIssue',p.number,`Écart signalé par ${name(currentUser)} : ${note}`);closeModal();apply();toast(`Écart signalé sur ${p.number}. La progression reste bloquée.`,'error');
 });
}
function openPhoto(key){modal('Photo déclarative','Archive privée sur cet appareil uniquement',`<p class="note">Photo soumise lors d’une déclaration. Aucune certification ni horodatage serveur.</p><img data-photo-key="${esc(key)}" class="photo-preview" style="height:auto;max-height:58vh;object-fit:contain" alt="Photo déclarative"><div class="modal-warning">Vérifier le repère et les informations ; la photo n'est pas une preuve suffisante du respect des prescriptions.</div>`,`${btn('Fermer','modal-cancel','btn-ghost')}`);}
function editPointModal(p=null,x=50,y=50){
 if(!isChef()||state.phase!=='preparation')return toast('Plan verrouillé après ouverture de la pose.','error');
 const edit=Boolean(p);const q=p||{uid:'c'+makeId(),number:'',voie:'1M',support:'',type:'CLR',symbol:'ligne-rail',agent:'agent1',flag:false,x,y};
 modal(edit?'Modifier une connexion':'Ajouter une connexion','Préparation et affectation des repères',`<form id="point-form"><div class="form-grid"><div class="form-field"><label for="point-number">Numéro de connexion *</label><input class="input" id="point-number" value="${esc(q.number)}" maxlength="20" required placeholder="Ex. 12"></div><div class="form-field"><label for="point-voie">Voie *</label><input class="input" id="point-voie" value="${esc(q.voie)}" maxlength="30" required></div><div class="form-field"><label for="point-support">Support / PK *</label><input class="input" id="point-support" value="${esc(q.support)}" maxlength="60" required></div><div class="form-field"><label for="point-type">Type de dispositif *</label><select class="input" id="point-type">${TYPES.map(t=>`<option ${q.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select></div><div class="form-field"><label for="point-symbol">Symbole sur le plan *</label><select class="input" id="point-symbol">${SYMBOLS.map(o=>`<option value="${o[0]}" ${q.symbol===o[0]?'selected':''}>${esc(o[1])} ${esc(o[2])}</option>`).join('')}</select></div><div class="form-field"><label for="point-agent">Agent affecté *</label><select class="input" id="point-agent">${Object.keys(NAME).filter(k=>k!=='chef').map(k=>`<option value="${k}" ${q.agent===k?'selected':''}>${esc(name(k))}</option>`).join('')}</select></div><div class="form-field"><label>Drapeau / lampe bleue</label><label class="check-row"><input type="checkbox" id="point-flag" ${q.flag?'checked':''}> Prévu dans l’exercice</label></div></div><p class="note">Placement : ${Math.round(q.x)} % largeur, ${Math.round(q.y)} % hauteur du schéma. Le déplacement précis se fait en glissant le symbole sur le plan.</p><div class="button-row" style="justify-content:flex-end;margin-top:16px">${edit?`<button type="button" id="point-delete" class="btn btn-danger">Supprimer</button>`:''}<button type="button" class="btn btn-ghost" data-action="modal-cancel">Annuler</button><button type="submit" class="btn btn-primary">Enregistrer</button></div></form>`);
 el('point-form').addEventListener('submit',ev=>{ev.preventDefault();const no=el('point-number').value.trim(),voie=el('point-voie').value.trim(),support=el('point-support').value.trim();
  if(!no||!voie||!support)return toast('Les trois informations sont obligatoires.','error');if(state.points.some(o=>o.number===no&&o.uid!==q.uid))return toast('Ce numéro existe déjà.','error');
  const values={number:no,voie,support,type:el('point-type').value,symbol:el('point-symbol').value,agent:el('point-agent').value,flag:el('point-flag').checked};
  if(edit)Object.assign(p,values);else{Object.assign(q,values);state.points.push(q);selected=q.uid;}
  log(edit?'update':'add',no,`${edit?'Connexion modifiée':'Nouvelle connexion ajoutée'} : ${voie}, support ${support}, affectée à ${name(values.agent)}.`);placement=false;closeModal();view='plan';apply();toast('Plan de démonstration mis à jour.');
 });
 if(edit)el('point-delete').addEventListener('click',()=>{if(state.points.length<=1)return toast('Le plan doit comporter au moins un repère.','error');state.points=state.points.filter(o=>o.uid!==q.uid);selected=state.points[0]?.uid||'';log('delete',q.number,'Repère retiré du projet de plan, avant validation.');closeModal();apply();toast('Repère supprimé.');});
}
async function importPlan(file){if(!isChef()||state.planLocked)return toast('Plan verrouillé.','error');try{const converted=await imageAsDataURL(file,2500,.82);await storeImage('plan_custom',converted.data);imgURL=converted.data;state.customPlan=true;state.imgRatio=converted.ratio;state.planName=`Image importée : ${file.name}`;log('plan',null,'Nouvelle image S11 de travail importée. Placement des symboles à réexaminer.');apply();toast('Schéma chargé. Repositionnez les symboles avant validation.');}catch(e){toast(e.message||'Échec de lecture du schéma.','error');}}
function resetModal(){confirmOnly('Réinitialiser CATÉNA',`Toutes les attestations et photos de cette démonstration seront effacées localement. Une sauvegarde JSON peut être faite préalablement.`,`Effacer la démo`,()=>{state=initialState();view='dashboard';selected=state.points[0].uid;imgURL='assets/schema_demo.png';zoomWidth=1150;placement=false;clearImages().catch(()=>{});},'Je confirme l’effacement définitif des données locales de cette démonstration.');}
function helpModal(){modal('CATÉNA est un prototype','Sécurité ferroviaire et périmètre d’utilisation',`<p>Cette version permet de tester la navigation, les affectations, les attestations avec photos et le recollement sur un appareil. Elle <strong>ne dispose pas</strong> d’authentification, de serveur, de synchronisation, de signature électronique probante ni d’envoi de dépêches sécurisées.</p><div class="modal-warning"><strong>Aucun usage opérationnel.</strong> Les données sont manipulables localement, les positions sont illustratives, et le plan pédagogique ne constitue pas une validation technique. Aucune autorisation de pose, dépose, chantier, consignation, restitution d’ARF ou remise sous tension n'est fournie.</div><p class="note">Avant déploiement : validation par les responsables métier, sécurité ferroviaire, électricité et cybersécurité ; référentiels applicables ; habilitations ; contrôles ; moyens de transmission officiels ; tests terrain et gestion du mode dégradé.</p>`,`${btn('Compris','modal-cancel','btn-primary')}`);}

function focusPoint(uid){selected=uid;view='plan';render();const p=point(uid),port=el('plan-viewport');if(port&&p){port.scrollLeft=Math.max(0,zoomWidth*p.x/100-port.clientWidth/2);port.scrollTop=Math.max(0,zoomWidth/(state.imgRatio||1718/755)*p.y/100-port.clientHeight/2);}window.scrollTo({top:0,behavior:'instant'});}
function go(v){if(!(v in TITLES))return;view=v;placement=false;render();window.scrollTo({top:0,behavior:'instant'});}
function selection(uid){const port=el('plan-viewport');const left=port?.scrollLeft||0,top=port?.scrollTop||0;selected=uid;render();const next=el('plan-viewport');if(next){next.scrollLeft=left;next.scrollTop=top;}}
function changeZoom(delta){zoomWidth=Math.min(2450,Math.max(650,zoomWidth+delta));const board=el('plan-board');if(board)board.style.width=zoomWidth+'px';const tag=el('zoom-level');if(tag)tag.textContent=Math.round(zoomWidth/1150*100)+' %';}
function onAction(action,element){
 const uid=element.dataset.uid;
 switch(action){
 case 'nav-plan':go('plan');break;case 'nav-mine':go('mine');break;case 'nav-review':go('review');break;case 'nav-messages':go('messages');break;case 'nav-settings':go('settings');break;
 case 'select-pin':if(suppressClick){suppressClick=false;break;}selection(uid);break;
 case 'focus-point':focusPoint(uid);break;
 case 'zoom-in':changeZoom(220);break;case 'zoom-out':changeZoom(-220);break;
 case 'toggle-placement':placement=!placement;render();break;
 case 'add-from-settings':view='plan';render();placement=true;render();toast('Touchez le schéma à l’emplacement souhaité.');break;
 case 'edit-point':editPointModal(point(uid));break;
 case 'do-point':{const p=point(uid);if(!p)return;const mode=state.phase==='pose'?'pose':state.phase==='depose'?'depose':null;if(mode)attestationModal(p,mode);break;}
 case 'review-point':reviewModal(point(uid));break;
 case 'view-photo':openPhoto(element.dataset.key);break;
 case 'begin-pose':beginPose();break;case 'begin-depose':beginDepose();break;case 'close-demo':closeDemo();break;
 case 'template':activeTemplate=element.dataset.template;render();break;
 case 'copy-message':{const text=messageText();if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>toast('Brouillon copié.')).catch(()=>manualCopy(text));}else manualCopy(text);break;}
 case 'export-csv':exportEventsCSV();break;case 'export-json':exportDemoJSON().catch(e=>toast('Export impossible : '+e.message,'error'));break;
 case 'reset-demo':resetModal();break;
 case 'modal-cancel':closeModal();break;
 }
}
function manualCopy(text){const t=doc.createElement('textarea');t.value=text;doc.body.appendChild(t);t.select();try{if(doc.execCommand('copy'))toast('Brouillon copié.');else toast('Sélectionnez le texte et copiez-le manuellement.');}catch(e){toast('Copie indisponible sur ce navigateur.','error');}t.remove();}
doc.addEventListener('click',ev=>{
 const nav=ev.target.closest('[data-view]');if(nav){go(nav.dataset.view);return;}
 if(ev.target.closest('[data-dismiss]')||ev.target.classList.contains('modal-backdrop')){closeModal();return;}
 const action=ev.target.closest('[data-action]');if(action){ev.preventDefault();onAction(action.dataset.action,action);return;}
 if(placement&&view==='plan'&&isChef()&&state.phase==='preparation'){
  const board=ev.target.closest('#plan-board');if(board&&!ev.target.closest('.plan-pin')){const r=board.getBoundingClientRect();const x=Math.max(0,Math.min(100,(ev.clientX-r.left)/r.width*100));const y=Math.max(0,Math.min(100,(ev.clientY-r.top)/r.height*100));editPointModal(null,Math.round(x*100)/100,Math.round(y*100)/100);}
 }
});
doc.addEventListener('pointerdown',ev=>{
 const pin=ev.target.closest('.plan-pin');if(!pin||state.phase!=='preparation'||!isChef()||placement)return;
 const board=el('plan-board');if(!board)return;
 drag={uid:pin.dataset.uid,pointer:ev.pointerId,startX:ev.clientX,startY:ev.clientY,x:parseFloat(pin.style.left),y:parseFloat(pin.style.top),moved:false,pin,board};pin.setPointerCapture?.(ev.pointerId);
});
doc.addEventListener('pointermove',ev=>{
 if(!drag||drag.pointer!==ev.pointerId)return;
 const dx=ev.clientX-drag.startX,dy=ev.clientY-drag.startY;
 if(Math.hypot(dx,dy)>4)drag.moved=true;
 if(drag.moved){const r=drag.board.getBoundingClientRect();const x=Math.min(99.5,Math.max(.5,drag.x+100*dx/r.width));const y=Math.min(99.5,Math.max(.5,drag.y+100*dy/r.height));drag.pin.style.left=x+'%';drag.pin.style.top=y+'%';}
});
doc.addEventListener('pointerup',ev=>{
 if(!drag||drag.pointer!==ev.pointerId)return;
 if(drag.moved){const p=point(drag.uid);if(p){p.x=Math.round(parseFloat(drag.pin.style.left)*100)/100;p.y=Math.round(parseFloat(drag.pin.style.top)*100)/100;log('update',p.number,'Position provisoire du symbole déplacée sur la capture.');persist();toast('Position provisoire enregistrée.');}suppressClick=true;setTimeout(()=>{suppressClick=false;},250);}drag=null;
});
doc.addEventListener('pointercancel',()=>{drag=null;});
doc.addEventListener('change',ev=>{
 if(ev.target.id==='actor-select'){currentUser=ev.target.value;render();toast('Profil de démonstration : '+name(currentUser));}
 if(ev.target.id==='plan-upload'&&ev.target.files?.[0])importPlan(ev.target.files[0]);
 if(ev.target.id==='import-json'&&ev.target.files?.[0])restoreDemoJSON(ev.target.files[0]).catch(e=>toast('Import refusé : '+(e.message||e),'error'));
});
doc.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modalRoot.innerHTML)closeModal();});
el('warning-info').addEventListener('click',helpModal);
(async function init(){
 try{db=await openDatabase();}catch(e){toast('Stockage de photos indisponible : les attestations seront désactivées.','error');}
 if(state.customPlan){imgURL=(await fetchImage('plan_custom').catch(()=>null))||'assets/schema_demo.png';}
 selected=state.points[0]?.uid||'';render();

})();
})();
