import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

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

async function fixOficio() {
    try {
        console.log("Obteniendo oficio OF-2026-009...");
        const oldRef = doc(db, "oficios", "OF-2026-009");
        const docSnap = await getDoc(oldRef);

        if (!docSnap.exists()) {
            console.log("No se encontro el oficio OF-2026-009.");
            process.exit(1);
        }

        const data = docSnap.data();

        console.log("Creando oficio OF-2026-008...");
        data.id = "OF-2026-008"; // Change ID manually
        const newRef = doc(db, "oficios", "OF-2026-008");
        await setDoc(newRef, data);

        console.log("Eliminando oficio OF-2026-009 original...");
        await deleteDoc(oldRef);

        console.log("Ajustando contador correlativo de oficios a 8...");
        await setDoc(doc(db, "correlatives", "oficio"), { count: 8 });

        console.log("¡Arreglo completado con exito!");
        process.exit(0);
    } catch (error) {
        console.error("Error durante el proceso:", error);
        process.exit(1);
    }
}

fixOficio();
