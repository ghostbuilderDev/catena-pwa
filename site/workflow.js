/* PEC Workflow Core 0.3.0 - simulation; server-side revalidation mandatory in production. */
(function(global,factory){
 const core=factory();
 if(typeof module==='object'&&module.exports)module.exports=core;
 global.PecWorkflow=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const phases=['preparation','pose','travail','retrait','cloture'];
 const phaseNames={preparation:'Préparation',pose:'Pose et recollement',travail:'Phase travaux',retrait:'Retrait et recollement',cloture:'Suivi clos'};
 const statusNames={pending:'À effectuer',declared:'Déclarée · contrôle attendu',accepted:'Recollectée',issue:'Écart · bloqué'};
 function record(item,mode){return item?.[mode]||{status:'pending'};}
 function status(item,mode){return record(item,mode).status||'pending';}
 function wave(item){return Math.max(1,Math.floor(Number(item?.wave)||1));}
 function isAccepted(item,mode){return status(item,mode)==='accepted';}
 function allAccepted(items,mode){return items.length>0&&items.every(item=>isAccepted(item,mode));}
 function unresolved(items,mode){return items.filter(item=>status(item,mode)==='issue');}
 function waveReady(items,item,mode){
  const w=wave(item);
  return items.every(p=>{
   if(p.id===item.id)return true;
   const required=mode==='pose'?wave(p)<w:wave(p)>w;
   return !required||isAccepted(p,mode);
  });
 }
 function canDeclare(s,item,actor,mode){
  if(!s||!item||!actor||!['pose','retrait'].includes(mode))return false;
  if(s.phase!==mode||item.agent!==actor||!waveReady(s.items,item,mode))return false;
  if(mode==='retrait'&&!isAccepted(item,'pose'))return false;
  return status(item,mode)==='pending';
 }
 function canReview(s,item,actor,mode){
  if(s?.phase!==mode||actor!=='chef')return false;
  const r=record(item,mode);return r.status==='declared'&&r.actor!=='chef';
 }
 function canReopen(s,item,actor,mode){return s?.phase===mode&&actor==='chef'&&status(item,mode)==='issue';}
 function configurationErrors(s){
  const errors=[];
  if(!Array.isArray(s?.items)||!s.items.length)errors.push('Aucun dispositif prévu dans le plan.');
  const seen=new Set();
  for(const item of (s?.items||[])){
   const label=String(item.number||'').trim();
   if(!label)errors.push('Une connexion n’a pas de numéro.');
   if(seen.has(label))errors.push(`Numéro en double : ${label}.`);seen.add(label);
   if(!item.agent)errors.push(`Connexion ${label||'?'} : agent non affecté.`);
   if(!Number.isInteger(Number(item.wave))||Number(item.wave)<1||Number(item.wave)>30)errors.push(`Connexion ${label||'?'} : groupe d’ordre invalide.`);
  }
  return errors;
 }
 function canBeginPose(s){return s?.phase==='preparation'&&configurationErrors(s).length===0&&String(s.firstStageRef||'').trim().length>=3&&!!s.planReviewed;}
 function canBeginTravail(s){return s?.phase==='pose'&&allAccepted(s.items,'pose')&&unresolved(s.items,'pose').length===0;}
 function canBeginRetrait(s){return s?.phase==='travail'&&String(s.workEndRef||'').trim().length>=3;}
 function canClose(s){return s?.phase==='retrait'&&allAccepted(s.items,'retrait')&&unresolved(s.items,'retrait').length===0&&String(s.cessationRef||'').trim().length>=3;}
 function counters(items,mode){const n=items.length;return {total:n,pending:items.filter(p=>status(p,mode)==='pending').length,declared:items.filter(p=>status(p,mode)==='declared').length,accepted:items.filter(p=>status(p,mode)==='accepted').length,issue:items.filter(p=>status(p,mode)==='issue').length};}
 function activeWave(s,mode){
  const waves=[...new Set(s.items.map(wave))].sort((a,b)=>mode==='retrait'?b-a:a-b);
  return waves.find(w=>s.items.some(item=>wave(item)===w&&status(item,mode)!=='accepted'))??null;
 }
 function safePlan(items){return Array.isArray(items)&&items.length>0&&items.length<=250&&items.every(p=>p&&typeof p.id==='string'&&String(p.number||'').trim());}
 return {phases,phaseNames,statusNames,record,status,wave,isAccepted,allAccepted,unresolved,waveReady,canDeclare,canReview,canReopen,configurationErrors,canBeginPose,canBeginTravail,canBeginRetrait,canClose,counters,activeWave,safePlan};
});
