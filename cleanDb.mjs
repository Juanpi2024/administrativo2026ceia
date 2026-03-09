import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function clean() {
    console.log("Limpiando Oficios...");
    const oficiosSnap = await getDocs(collection(db, "oficios"));
    for (const d of oficiosSnap.docs) {
        await deleteDoc(doc(db, "oficios", d.id));
        console.log("Borrado oficio: ", d.id);
    }

    console.log("Limpiando Permisos...");
    const permisosSnap = await getDocs(collection(db, "permisos"));
    for (const d of permisosSnap.docs) {
        await deleteDoc(doc(db, "permisos", d.id));
        console.log("Borrado permiso: ", d.id);
    }
    console.log("¡Limpieza en la nube completada!");
    process.exit(0);
}

clean().catch(e => {
    console.error(e);
    process.exit(1);
});
