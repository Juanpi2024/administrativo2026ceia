import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAarN-EztA4dyRRU8WIPrTdsgTAmkL4bDE",
    authDomain: "admin-ceia-2026-portal.firebaseapp.com",
    projectId: "admin-ceia-2026-portal",
    storageBucket: "admin-ceia-2026-portal.firebasestorage.app",
    messagingSenderId: "151342778604",
    appId: "1:151342778604:web:51031d10718df66c0cbdc9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetCorrelatives() {
    console.log("Reiniciando correlativos a 0...");
    await setDoc(doc(db, "correlatives", "oficio"), { count: 0 });
    await setDoc(doc(db, "correlatives", "permiso"), { count: 0 });
    console.log("¡Correlativos reiniciados exitosamente!");
    process.exit(0);
}

resetCorrelatives().catch(e => {
    console.error(e);
    process.exit(1);
});
