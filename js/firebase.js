import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { state, saveLocalData, saveLocalPlan } from './data.js';

const firebaseConfig = {
  apiKey: "AIzaSyD6-Sn9kM_Pnj1SxTmDT82H3C6kqAqS_ig",
  authDomain: "fitko-9c0df.firebaseapp.com",
  projectId: "fitko-9c0df",
  storageBucket: "fitko-9c0df.firebasestorage.app",
  messagingSenderId: "1015033490512",
  appId: "1:1015033490512:web:77bf9312cdb9bb503b7555"
};

let auth = null;
let db = null;
let firebaseInitialized = false;

// === LIFE CYCLE: INIT FIREBASE ===
export function initFirebase() {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        firebaseInitialized = true;
        return { auth, db, success: true };
    } catch (e) {
        console.warn("Firebase Init Error:", e);
        return { success: false };
    }
}

// Helpers to access instances safely
export { auth, db, firebaseInitialized };

// === UI HELPERS ===
export function updateAuthUI(user) {
    const statusEl = document.getElementById('user-status');
    const btnEl = document.getElementById('google-btn');
    if (!statusEl || !btnEl) return;

    if (!firebaseInitialized) {
        statusEl.innerText = 'Offline režim';
        btnEl.style.display = 'none';
        return;
    }

    if (user && !user.isAnonymous) {
        statusEl.innerText = `👤 ${user.displayName || user.email}`;
        btnEl.style.display = 'none';
    } else {
        statusEl.innerText = 'Lokální režim / Anonymní';
        btnEl.style.display = 'inline-flex';
    }
}

// === AUTH ACTIONS ===
export async function loginGoogle() {
    if (!firebaseInitialized) return;
    try { 
        await signInWithPopup(auth, new GoogleAuthProvider()); 
    } catch (e) { 
        if (e.code === 'auth/unauthorized-domain') {
            alert("Doména není autorizována pro Firebase login.");
        } else if (e.code !== 'auth/popup-closed-by-user') {
            alert("Chyba přihlášení: " + e.message); 
        }
    }
}

// === SYNC LOGIC ===
export async function syncFromFirestore(uid) {
    if (!firebaseInitialized || !db) return;
    try {
        const planRef = doc(db, "users", uid, "settings", "plan");
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
            state.plan = planSnap.data().plan;
            saveLocalPlan();
        } else {
            await saveCloudPlan();
        }

        const weeksRef = collection(db, "users", uid, "weeks");
        const snapshot = await getDocs(weeksRef);
        if (!snapshot.empty) {
            snapshot.forEach(doc => { state.weeks[doc.id] = doc.data(); });
            saveLocalData();
        }
    } catch (e) {}
}

export async function saveCloudWeekData(weekId) {
    saveLocalData();
    if (firebaseInitialized && state.currentUser && db) {
        try {
            const weekData = state.weeks[weekId];
            if (!weekData) return;
            await setDoc(doc(db, "users", state.currentUser.uid, "weeks", weekId), weekData, { merge: true });
        } catch (e) {}
    }
}

export async function saveCloudPlan() {
    saveLocalPlan();
    if (firebaseInitialized && state.currentUser && db) {
        try {
            await setDoc(doc(db, "users", state.currentUser.uid, "settings", "plan"), { plan: state.plan }, { merge: true });
        } catch(e) {}
    }
}