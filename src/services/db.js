import { db } from '../firebase';
import { collection, doc, getDocs, query, where, setDoc, runTransaction, orderBy } from 'firebase/firestore';

const isMock = import.meta.env.VITE_FIREBASE_API_KEY === undefined || import.meta.env.VITE_FIREBASE_API_KEY === 'dummy_api_key';

export function calculateDays(startStr, endStr, jornada = 'Completa') {
    if (!startStr || !endStr) return 0;

    if (jornada.includes('Medio Día')) {
        return 0.5;
    }

    const d1 = new Date(startStr);
    const d2 = new Date(endStr);
    if (isNaN(d1) || isNaN(d2)) return 0;
    return Math.abs(Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24))) + 1;
}

export async function getNextCorrelative(type) {
    if (isMock) {
        const val = parseInt(localStorage.getItem(`correlative_${type}`) || '0') + 1;
        localStorage.setItem(`correlative_${type}`, val.toString());
        const prefix = type === 'oficio' ? 'OF' : 'PA';
        return `${prefix}-2026-${val.toString().padStart(3, '0')}`;
    }

    const prefix = type === 'oficio' ? 'OF' : 'PA';
    let correlativeStr = '';
    const ref = doc(db, 'correlatives', type);

    await runTransaction(db, async (transaction) => {
        const d = await transaction.get(ref);
        let count = 1;
        if (d.exists()) {
            count = d.data().count + 1;
        }
        transaction.set(ref, { count });
        correlativeStr = `${prefix}-2026-${count.toString().padStart(3, '0')}`;
    });

    return correlativeStr;
}

export async function saveOficio(oficioData) {
    if (isMock) {
        oficioData.id = await getNextCorrelative('oficio');
        oficioData.createdAt = new Date().toISOString();
        const existing = JSON.parse(localStorage.getItem('oficios') || '[]');
        localStorage.setItem('oficios', JSON.stringify([oficioData, ...existing]));
        return oficioData;
    }

    oficioData.id = await getNextCorrelative('oficio');
    oficioData.createdAt = new Date().toISOString();
    await setDoc(doc(db, 'oficios', oficioData.id), oficioData);
    return oficioData;
}

export async function checkPermisosDays(funcionarioId) {
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('permisos') || '[]');
        const userPermisos = existing.filter(p => p.funcionarioId === funcionarioId);
        let taken = 0;
        userPermisos.forEach(p => taken += calculateDays(p.fechaInicio, p.fechaFin, p.jornada));
        return { taken, left: 6 - taken };
    }

    const q = query(collection(db, 'permisos'), where('funcionarioId', '==', funcionarioId));
    const snap = await getDocs(q);
    let taken = 0;
    snap.forEach(d => taken += calculateDays(d.data().fechaInicio, d.data().fechaFin, d.data().jornada));
    return { taken, left: 6 - taken };
}

export async function savePermiso(permisoData) {
    permisoData.diasUsados = calculateDays(permisoData.fechaInicio, permisoData.fechaFin, permisoData.jornada);

    if (isMock) {
        permisoData.id = await getNextCorrelative('permiso');
        permisoData.createdAt = new Date().toISOString();
        const existing = JSON.parse(localStorage.getItem('permisos') || '[]');
        localStorage.setItem('permisos', JSON.stringify([permisoData, ...existing]));
        return permisoData;
    }

    permisoData.id = await getNextCorrelative('permiso');
    permisoData.createdAt = new Date().toISOString();
    await setDoc(doc(db, 'permisos', permisoData.id), permisoData);
    return permisoData;
}

export async function loadOficios() {
    if (isMock) return JSON.parse(localStorage.getItem('oficios') || '[]');
    const q = query(collection(db, 'oficios'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}

export async function loadPermisos() {
    if (isMock) return JSON.parse(localStorage.getItem('permisos') || '[]');
    const q = query(collection(db, 'permisos'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}
