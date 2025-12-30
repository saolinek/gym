import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { state, saveLocalData, saveLocalPlan } from './data.js';

// === CONFIGURATION ===
const firebaseConfig = {
  apiKey: "AIzaSyD6-Sn9kM_Pnj1SxTmDT82H3C6kqAqS_ig",
  authDomain: "fitko-9c0df.firebaseapp.com",
  projectId: "fitko-9c0df",
  storageBucket: "fitko-9c0df.firebasestorage.app",
  messagingSenderId: "1015033490512",
  appId: "1:1015033490512:web:77bf9312cdb9bb503b7555"
};

// === INITIALIZATION ===
let app = null;
let auth = null;
let db = null;
let firebaseInitialized = false;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseInitialized = true;
    console.log("Firebase initialized successfully");
} catch (e) {
    console.warn("Firebase Init Failed (Running in Offline Mode):", e);
    // Mock objects to prevent crashes in other modules
    auth = { currentUser: null, onAuthStateChanged: () => {} };
    db = null;
    firebaseInitialized = false;
}

// Export initialized instances
export { auth, db, firebaseInitialized };

// === UI HELPERS ===
export function updateAuthUI(user) {
    const statusEl = document.getElementById('user-status');
    const btnEl = document.getElementById('google-btn');
    
    if (!statusEl || !btnEl) return;

    if (!firebaseInitialized) {
        statusEl.innerText = 'Offline režim (Firebase nedostupný)';
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
    if (!firebaseInitialized) {
        alert("Přihlášení není dostupné (Offline režim)");
        return;
    }
    try { 
        await signInWithPopup(auth, new GoogleAuthProvider()); 
    } catch (e) { 
        console.error("Login Error:", e);
        alert("Chyba přihlášení: " + e.message); 
    }
}

// === SYNC LOGIC ===
export async function syncFromFirestore(uid) {
    if (!firebaseInitialized || !db) return;

    try {
        // 1. Sync Plan
        const planRef = doc(db, "users", uid, "settings", "plan");
        const planSnap = await getDoc(planRef);
        if (planSnap.exists()) {
            state.plan = planSnap.data().plan;
            saveLocalPlan();
        } else {
            await saveCloudPlan();
        }

        // 2. Sync History
        const weeksRef = collection(db, "users", uid, "weeks");
        const snapshot = await getDocs(weeksRef);
        if (!snapshot.empty) {
            snapshot.forEach(doc => { 
                state.weeks[doc.id] = doc.data(); 
            });
            saveLocalData();
        }
    } catch (e) { 
        console.warn("Sync Warning (Offline?):", e); 
    }
}

export async function saveCloudWeekData(weekId) {
    saveLocalData(); // Always save local first
    
    if (firebaseInitialized && state.currentUser && db) {
        try {
            const weekData = state.weeks[weekId];
            if (!weekData) return;
            const docRef = doc(db, "users", state.currentUser.uid, "weeks", weekId);
            await setDoc(docRef, weekData, { merge: true });
        } catch (e) {
            console.warn("Cloud Save Error:", e);
        }
    }
}

export async function saveCloudPlan() {
    saveLocalPlan(); // Always save local first

    if (firebaseInitialized && state.currentUser && db) {
        try {
            const docRef = doc(db, "users", state.currentUser.uid, "settings", "plan");
            await setDoc(docRef, { plan: state.plan }, { merge: true });
        } catch(e) {
            console.warn("Cloud Plan Save Error:", e);
        }
    }
}