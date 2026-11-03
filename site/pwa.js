/* PEC PWA 0.2.3 - installation, connexion, mise à jour contrôlée. */
(() => {
  'use strict';
  const installButton=document.querySelector('#pwa-install');
  const updateButton=document.querySelector('#pwa-update');
  const connection=document.querySelector('#pwa-connection-label');
  if(!installButton || !updateButton) return;
  let deferredPrompt=null;
  let refreshWhenControlled=false;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  const updateConnection=()=>{if(connection)connection.textContent=navigator.onLine?'Démo locale':'Hors ligne';};
  updateConnection();
  window.addEventListener('online',updateConnection);
  window.addEventListener('offline',updateConnection);
  function installHelp(){
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    alert(mobile?'Android / Chrome : menu ⋮ puis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur iPhone / Safari : Partager puis « Sur l’écran d’accueil ».':'Dans votre navigateur, utilisez le menu « Installer l’application » ou « Créer un raccourci ».');
  }
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();deferredPrompt=event;
    if(!standalone()) installButton.hidden=false;
  });
  installButton.addEventListener('click',async()=>{
    if(standalone()){installButton.hidden=true;return;}
    if(!deferredPrompt){installHelp();return;}
    const prompt=deferredPrompt;deferredPrompt=null;
    try{await prompt.prompt();await prompt.userChoice;}catch(e){installHelp();}
    installButton.hidden=true;
  });
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;installButton.hidden=true;});
  // Toujours aider à trouver l'installation, sans afficher de bouton une fois installé.
  if(!standalone()) installButton.hidden=false;
  const secure=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
  if(!secure || !('serviceWorker' in navigator)) return;
  function offerUpdate(reg){
    if(reg.waiting && navigator.serviceWorker.controller){updateButton.hidden=false;updateButton.onclick=()=>{refreshWhenControlled=true;reg.waiting.postMessage({type:'SKIP_WAITING'});};}
  }
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshWhenControlled){refreshWhenControlled=false;location.reload();}
  });
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
    offerUpdate(reg);
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;
      if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')offerUpdate(reg);});
    });
    window.addEventListener('focus',()=>reg.update().catch(()=>{}));
  }).catch(()=>{ /* App accessible en ligne même si le mode hors-ligne échoue. */ });
})();
