/* Business-rule model for the LOCAL DEMO. Production MUST re-check all rules on the server. */
(function(global,factory){
  const core=factory();
  if(typeof module==='object'&&module.exports){module.exports=core;}
  global.CatenaCore=core;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STEPS_POSE=['precheck','vat','postcheck','fixing','location'];
  const STEPS_DEPOSE=['removed','siteClear'];
  function counts(points){
    return {total:points.length,posed:points.filter(p=>p.pose?.declared).length,poseVerified:points.filter(p=>p.pose?.verified).length,removed:points.filter(p=>p.depose?.declared).length,removeVerified:points.filter(p=>p.depose?.verified).length,issues:points.filter(p=>p.pose?.issue||p.depose?.issue).length};
  }
  function allVerified(points,mode){return points.length>0&&points.every(p=>Boolean(p[mode]?.verified)&&!p[mode]?.issue);}
  function canPose(point,phase,userId){return phase==='pose'&&point?.agent===userId&&!point.pose?.verified;}
  function canReviewPose(point,phase,userId){return phase==='pose'&&Boolean(point?.pose?.declared)&&!point.pose?.verified&&!point.pose?.issue&&point.pose?.actor!==userId;}
  function canOpenDepose(points,phase){return phase==='pose'&&allVerified(points,'pose');}
  function canDepose(point,phase,userId){return phase==='depose'&&Boolean(point?.pose?.verified)&&point.agent===userId&&!point.depose?.verified;}
  function canReviewDepose(point,phase,userId){return phase==='depose'&&Boolean(point?.depose?.declared)&&!point.depose?.verified&&!point.depose?.issue&&point.depose?.actor!==userId;}
  function canClose(points,phase){return phase==='depose'&&allVerified(points,'depose');}
  function validateEvidence(mode,checklist,hasPhoto,attested){const keys=mode==='pose'?STEPS_POSE:STEPS_DEPOSE;return Boolean(hasPhoto&&attested&&keys.every(k=>checklist?.[k]===true));}
  function getPoseState(p){return p.pose?.issue?'issue':p.pose?.verified?'verified':p.pose?.declared?'declared':'pending';}
  function getDeposeState(p){return p.depose?.issue?'issue':p.depose?.verified?'removed':p.depose?.declared?'declared':'pending';}
  return {STEPS_POSE,STEPS_DEPOSE,counts,allVerified,canPose,canReviewPose,canOpenDepose,canDepose,canReviewDepose,canClose,validateEvidence,getPoseState,getDeposeState};
});
