// firebase-config.js

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDzhyapnBBPeZhUWY1sNxvFtDpnFByRvbY",
    authDomain: "centro-estetico-mello.firebaseapp.com",
    projectId: "centro-estetico-mello",
    storageBucket: "centro-estetico-mello.firebasestorage.app",
    messagingSenderId: "83005252619",
    appId: "1:83005252619:web:658930391c0e265210d30e",
    measurementId: "G-YDYG36BDL9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };