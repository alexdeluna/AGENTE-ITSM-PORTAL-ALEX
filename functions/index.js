const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
initializeApp(); const db=getFirestore(); const MAX_AUTH_AGE_SECONDS=15*60;
exports.createAceTicket=onCall(async request=>{
  if(!request.auth)throw new HttpsError('unauthenticated','Autenticação obrigatória.');
  if(Date.now()/1000-(request.auth.token.auth_time||0)>MAX_AUTH_AGE_SECONDS)throw new HttpsError('failed-precondition','Confirme sua identidade para continuar.');
  const {serviceId,subcategory,description}=request.data||{};
  if(typeof serviceId!=='string'||typeof subcategory!=='string'||typeof description!=='string')throw new HttpsError('invalid-argument','Dados inválidos.');
  const text=description.trim(), words=text.match(/[A-Za-zÀ-ÿ]{2,}/g)||[];
  if(text.length<20||words.length<4)throw new HttpsError('invalid-argument','Informe uma descrição mais completa.');
  const [profileSnap,serviceSnap]=await Promise.all([db.doc(`users/${request.auth.uid}`).get(),db.doc(`services/${serviceId}`).get()]);
  if(!profileSnap.exists||profileSnap.data().active===false)throw new HttpsError('permission-denied','Perfil indisponível.');
  if(!serviceSnap.exists)throw new HttpsError('not-found','Serviço indisponível.');
  const profile=profileSnap.data(), service=serviceSnap.data(), config=service.subcategoryConfig?.[subcategory];
  if(service.active===false||!config||config.active===false||service.subcategoryStatus?.[subcategory]===false)throw new HttpsError('failed-precondition','Opção indisponível.');
  const ticket=await db.runTransaction(async tx=>{const counterRef=db.doc('counters/aceTickets'),counter=await tx.get(counterRef),id=Math.max(1001,Number(counter.data()?.lastId||1000)+1);tx.set(counterRef,{lastId:id},{merge:true});const data={id,openedBy:profile.username||request.auth.token.email,requester:profile.username||request.auth.token.email,requesterId:request.auth.uid,service:service.name,subcategory,type:config.type,criticality:config.criticality,sla:config.sla,status:'Aberto',responsible:null,pendingHistory:[],openedAt:new Date().toISOString(),description:text,createdBy:'ace'};tx.set(db.collection('tickets').doc(),data);return data});
  return{id:ticket.id};
});
