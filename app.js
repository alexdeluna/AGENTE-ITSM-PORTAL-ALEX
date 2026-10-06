import {auth,db,functions,googleProvider,collection,doc,getDoc,getDocs,httpsCallable,onAuthStateChanged,signInWithEmailAndPassword,signInWithPopup,signOut,EmailAuthProvider,reauthenticateWithCredential,reauthenticateWithPopup} from './firebase.js';
import {addDoc} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
const $=s=>document.querySelector(s), IDLE_MS=15*60*1000;
const state={user:null,services:[],service:null,subcategory:null,description:'',ticket:null,lastActivity:0};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function touch(){state.lastActivity=Date.now()} function expired(){return !state.lastActivity||Date.now()-state.lastActivity>IDLE_MS}
function shell(content){return `<div class="shell"><header class="head"><div class="mark">ACE</div><div><h1>Agente Conversacional Estruturado</h1><p>Atendimento de TI</p></div></header><section class="card">${state.user?`<div class="identity"><span>Atendendo: <strong>${esc(state.user.name)}</strong></span><button id="logout">Sair</button></div>`:''}${content}</section></div>`}
function render(content){$('#app').innerHTML=shell(content);const out=$('#logout');if(out)out.onclick=()=>signOut(auth)}
function login(){render(`<div class="login"><h2 class="prompt">Entrar no atendimento</h2><p class="text">Use a mesma conta institucional cadastrada no Portal ITSM.</p><label class="field">E-mail<input id="email" type="email" autocomplete="email" required></label><label class="field">Senha<input id="password" type="password" autocomplete="current-password" required></label><div id="login-error" class="error"></div><div class="actions"><button class="primary" id="enter">Entrar</button><button class="secondary" id="google">Entrar com Google</button></div></div>`);$('#enter').onclick=async()=>{try{await signInWithEmailAndPassword(auth,$('#email').value.trim(),$('#password').value)}catch(e){$('#login-error').textContent='Não foi possível entrar. Verifique seus dados.'}};$('#google').onclick=async()=>{try{await signInWithPopup(auth,googleProvider)}catch(e){$('#login-error').textContent='Não foi possível entrar com Google.'}}}
async function loadServices(){const snapshot=await getDocs(collection(db,'services'));state.services=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(s=>s.active!==false).sort((a,b)=>(a.name||'').localeCompare(b.name||'','pt-BR'))}
function services(prefix){render(`<p class="hello">${prefix||`Olá, ${esc(state.user.name)}! Sou o assistente de atendimento de TI. Vou ajudá-lo a registrar sua solicitação.`}</p><h2 class="prompt">Qual serviço você precisa?</h2><div class="cards">${state.services.map(s=>`<button class="choice" data-service="${esc(s.id)}"><img src="assets/${esc(s.image||'service-default.png')}" onerror="this.src='assets/service-default.png'" alt=""><span><strong>${esc(s.name)}</strong><span>${esc(s.description||'Selecione para ver as opções disponíveis.')}</span></span><b class="arrow">›</b></button>`).join('')}</div>`);document.querySelectorAll('[data-service]').forEach(b=>b.onclick=()=>{state.service=state.services.find(s=>s.id===b.dataset.service);state.subcategory=null;state.description='';touch();subcategories()})}
function activeSubs(){return(state.service.subcategories||[]).filter(s=>state.service.subcategoryStatus?.[s]!==false&&state.service.subcategoryConfig?.[s]?.active!==false)}
function subcategories(){const subs=activeSubs();render(`<p class="hello">Entendi. Você precisa de atendimento relacionado a <strong>${esc(state.service.name)}</strong>.</p><h2 class="prompt">Qual opção melhor descreve sua necessidade?</h2><div class="cards">${subs.map(s=>`<button class="choice" data-sub="${esc(s)}"><img src="assets/${esc(state.service.image||'service-default.png')}" onerror="this.src='assets/service-default.png'" alt=""><span><strong>${esc(s)}</strong><span>Selecionar esta opção</span></span><b class="arrow">›</b></button>`).join('')}</div><div class="actions"><button class="secondary" id="change-service">Alterar serviço</button></div>`);document.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{state.subcategory=b.dataset.sub;state.description=state.service.subcategoryConfig?.[state.subcategory]?.suggestedDescription||'';touch();descriptionChoice()});$('#change-service').onclick=()=>services('Vamos escolher outro serviço.')}
function descriptionChoice(){const suggested=state.description.trim();render(`<p class="hello">${suggested?'Com base no que você selecionou, preparei uma descrição para o chamado:':'Agora descreva sua solicitação com mais detalhes.'}</p>${suggested?`<div class="suggestion">${esc(suggested)}</div><p class="hello">Essa descrição está correta?</p>`:'<p class="text">Informe onde ocorre e o que está acontecendo. Exemplo: “A impressora da recepção não está imprimindo os documentos enviados pelo computador 03.”</p>'}<div class="actions">${suggested?'<button class="primary" id="accept">Sim</button>':''}<button class="secondary" id="edit">${suggested?'Editar descrição':'Informar descrição'}</button></div>`);if(suggested)$('#accept').onclick=()=>summary();$('#edit').onclick=editDescription}
function validate(text){if(text.length<20)return'Escreva ao menos 20 caracteres.';if((text.match(/[A-Za-zÀ-ÿ]{2,}/g)||[]).length<4)return'Inclua mais detalhes sobre o local e o que está acontecendo.';if(/^(teste|asdf|qwerty)$/i.test(text)||/^(.)\1{5,}$/.test(text.replace(/\s/g,'')))return'Essa descrição parece insuficiente.';return''}
function editDescription(){render(`<h2 class="prompt">Edite a descrição da sua solicitação</h2><p class="text">Informe onde ocorre e o que está acontecendo.</p><label class="field">Descrição<textarea id="description" maxlength="2000">${esc(state.description)}</textarea></label><div id="form-error" class="error"></div><div class="actions"><button class="primary" id="save">Confirmar descrição</button><button class="secondary" id="cancel">Cancelar</button></div>`);$('#save').onclick=()=>{const text=$('#description').value.trim(),error=validate(text);if(error){$('#form-error').textContent=error;return}state.description=text;touch();summary()};$('#cancel').onclick=descriptionChoice}
function summary(){render(`<h2 class="prompt">Confira sua solicitação</h2><div class="summary"><div><small>Serviço</small><p>${esc(state.service.name)}</p></div><div><small>Subcategoria</small><p>${esc(state.subcategory)}</p></div><div><small>Descrição</small><p>${esc(state.description)}</p></div></div><p class="hello">Está tudo correto?</p><div class="actions"><button class="primary" id="create">Confirmar e abrir chamado</button><button class="secondary" id="change">Alterar</button></div>`);$('#create').onclick=prepare;$('#change').onclick=change}
function change(){render(`<h2 class="prompt">O que você deseja alterar?</h2><div class="actions"><button class="secondary" id="service">Serviço</button><button class="secondary" id="sub">Subcategoria</button><button class="secondary" id="description">Descrição</button></div>`);$('#service').onclick=()=>services('Vamos alterar o serviço.');$('#sub').onclick=subcategories;$('#description').onclick=editDescription}
async function prepare(){if(expired())return reauth('Sua sessão de atendimento expirou. Para sua segurança, confirme sua identidade para continuar.',create);try{await create()}catch(e){console.error(e);render(`<p class="error">Não foi possível abrir o chamado. ${esc(e.message||'Tente novamente.')}</p><div class="actions"><button class="primary" id="retry">Tentar novamente</button></div>`);$('#retry').onclick=prepare}}
function reauth(message,next){render(`<div class="notice">${message}</div><h2 class="prompt" style="margin-top:18px">Confirme sua identidade</h2><div id="reauth"></div>`);const google=auth.currentUser.providerData.some(p=>p.providerId==='google.com'),done=async()=>{await auth.currentUser.getIdToken(true);touch();await next()};$('#reauth').innerHTML=google?`<div class="actions"><button class="primary" id="google">Continuar com Google</button></div>`:`<label class="field">Senha<input id="password" type="password" autocomplete="current-password"></label><div id="reauth-error" class="error"></div><div class="actions"><button class="primary" id="confirm">Confirmar identidade</button></div>`;if(google)$('#google').onclick=async()=>{try{await reauthenticateWithPopup(auth.currentUser,googleProvider);await done()}catch(e){$('#reauth').insertAdjacentHTML('beforeend','<p class="error">Não foi possível confirmar a identidade.</p>')}};else $('#confirm').onclick=async()=>{try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(auth.currentUser.email,$('#password').value));await done()}catch(e){$('#reauth-error').textContent='Não foi possível confirmar a identidade. Verifique a senha.'}}}
async function create(){
    render('<p class="loading">Registrando sua solicitação…</p>');

    const config=state.service.subcategoryConfig?.[state.subcategory];

    if(!config){
        throw new Error('A configuração da subcategoria não está disponível.');
    }

    const ticketsSnapshot=await getDocs(collection(db,'tickets'));

    const nextId=Math.max(
        ...ticketsSnapshot.docs.map(d=>Number(d.data().id)||0),
        1000
    )+1;

    const ticket={
        id:nextId,
        openedBy:auth.currentUser.email,
        requester:auth.currentUser.email,
        requesterId:auth.currentUser.uid,
        service:state.service.name,
        subcategory:state.subcategory,
        type:config.type,
        criticality:config.criticality,
        sla:config.sla,
        status:'Aberto',
        responsible:null,
        pendingHistory:[],
        openedAt:new Date().toISOString(),
        description:state.description,
        createdBy:'ace'
    };

    await addDoc(collection(db,'tickets'),ticket);

    state.ticket=ticket;
    touch();
    success();
}

function success(){render(`<div class="success"><div class="check">✓</div><h2 class="prompt">Chamado aberto com sucesso!</h2><p class="text">Sua solicitação foi registrada no Portal de Atendimento de TI.</p><div class="protocol">#${new Date().getFullYear()}-${state.ticket.id}</div><div class="actions" style="justify-content:center"><button class="primary" id="new">Abrir novo chamado</button></div></div>`);$('#new').onclick=()=>expired()?reauth('Sua sessão de atendimento expirou. Confirme sua identidade antes de iniciar outro chamado.',reset):reset()}
function reset(){state.service=null;state.subcategory=null;state.description='';state.ticket=null;touch();services('Claro. Vamos registrar uma nova solicitação.')}
onAuthStateChanged(auth,async user=>{if(!user){state.user=null;login();return}try{const profile=await getDoc(doc(db,'users',user.uid));if(!profile.exists()||profile.data().active===false){await signOut(auth);return}const p=profile.data();state.user={name:p.name||user.displayName||user.email,username:p.username||user.email.split('@')[0]};await loadServices();touch();services();if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js')}catch(e){console.error(e);render('<p class="error">Não foi possível iniciar o atendimento. Verifique a conexão e as permissões do Firebase.</p>')}});
