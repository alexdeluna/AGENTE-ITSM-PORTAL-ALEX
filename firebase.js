import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';
const app=initializeApp(firebaseConfig);
export const auth=getAuth(app), db=getFirestore(app), functions=getFunctions(app), googleProvider=new GoogleAuthProvider();
export {collection,doc,getDoc,getDocs,httpsCallable,onAuthStateChanged,signInWithEmailAndPassword,signInWithPopup,signOut,EmailAuthProvider,reauthenticateWithCredential,reauthenticateWithPopup};
