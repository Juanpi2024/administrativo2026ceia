import { db } from '../firebase';
import { collection, doc, getDocs, query, where, setDoc, deleteDoc, updateDoc, runTransaction, orderBy } from 'firebase/firestore';

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
        const prefix = type === 'oficio' ? 'OF' : (type === 'licencia' ? 'LM' : 'PA');
        return `${prefix}-2026-${val.toString().padStart(3, '0')}`;
    }

    const prefix = type === 'oficio' ? 'OF' : (type === 'licencia' ? 'LM' : 'PA');
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
    const year = 2026;
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('permisos') || '[]');
        // Solo sumamos los que son de tipo "Día Administrativo" del año actual
        const adminPermisos = existing.filter(p => 
            String(p.funcionarioId) === String(funcionarioId) && 
            p.tipoPermiso === 'Día Administrativo' &&
            new Date(p.fechaInicio).getFullYear() === year
        );
        let taken = 0;
        adminPermisos.forEach(p => taken += calculateDays(p.fechaInicio, p.fechaFin, p.jornada));
        return { taken, left: 6 - taken };
    }

    const q = query(
        collection(db, 'permisos'), 
        where('funcionarioId', '==', funcionarioId),
        where('tipoPermiso', '==', 'Día Administrativo')
    );
    const snap = await getDocs(q);
    let taken = 0;
    // Filter by year in memory since Firestore 'where' on sub-fields or multiple ranges can be tricky without indexes
    snap.forEach(d => {
        const data = d.data();
        if (new Date(data.fechaInicio).getFullYear() === year) {
            taken += calculateDays(data.fechaInicio, data.fechaFin, data.jornada);
        }
    });
    return { taken, left: 6 - taken };
}

export async function savePermiso(permisoData) {
    permisoData.diasUsados = calculateDays(permisoData.fechaInicio, permisoData.fechaFin, permisoData.jornada);
    // Ensure ID is stored as string for consistency if needed, but here we keep it as provided (usually number from users.js)
    
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
    const local = JSON.parse(localStorage.getItem('oficios') || '[]');
    if (isMock) return local;

    try {
        const q = query(collection(db, 'oficios'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const cloud = snap.docs.map(d => d.data());

        const combined = [...cloud];
        local.forEach(lo => {
            if (!combined.some(co => co.id === lo.id)) combined.push(lo);
        });
        return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        console.warn("Firestore inaccesible, cargando datos locales:", e);
        return local;
    }
}

export async function loadPermisos() {
    const local = JSON.parse(localStorage.getItem('permisos') || '[]');
    if (isMock) return local;

    try {
        const q = query(collection(db, 'permisos'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const cloud = snap.docs.map(d => d.data());

        const combined = [...cloud];
        local.forEach(lp => {
            if (!combined.some(cp => cp.id === lp.id)) combined.push(lp);
        });
        return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        console.warn("Firestore inaccesible, cargando datos locales:", e);
        return local;
    }
}

export async function saveLicencia(licenciaData) {
    licenciaData.diasUsados = calculateDays(licenciaData.fechaInicio, licenciaData.fechaFin, licenciaData.jornada);

    if (isMock) {
        licenciaData.id = await getNextCorrelative('licencia');
        licenciaData.createdAt = new Date().toISOString();
        const existing = JSON.parse(localStorage.getItem('licencias') || '[]');
        localStorage.setItem('licencias', JSON.stringify([licenciaData, ...existing]));
        return licenciaData;
    }

    licenciaData.id = await getNextCorrelative('licencia');
    licenciaData.createdAt = new Date().toISOString();
    await setDoc(doc(db, 'licencias', licenciaData.id), licenciaData);
    return licenciaData;
}

export async function loadLicencias() {
    const local = JSON.parse(localStorage.getItem('licencias') || '[]');
    if (isMock) return local;

    try {
        const q = query(collection(db, 'licencias'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const cloud = snap.docs.map(d => d.data());

        const combined = [...cloud];
        local.forEach(lp => {
            if (!combined.some(cp => cp.id === lp.id)) combined.push(lp);
        });
        return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        console.warn("Firestore inaccesible, cargando datos locales:", e);
        return local;
    }
}

// ==========================================
// NUEVAS FUNCIONES PARA EDITAR Y ELIMINAR
// ==========================================

export async function deleteOficio(id) {
    const existing = JSON.parse(localStorage.getItem('oficios') || '[]');
    if (existing.some(o => o.id === id)) {
        localStorage.setItem('oficios', JSON.stringify(existing.filter(o => o.id !== id)));
    }

    if (!isMock) {
        try {
            await deleteDoc(doc(db, 'oficios', id));
        } catch (error) {
            console.error("Error al borrar oficio en Firestore:", error);
        }
    }
    return true;
}

export async function deletePermiso(id) {
    const existing = JSON.parse(localStorage.getItem('permisos') || '[]');
    if (existing.some(p => p.id === id)) {
        localStorage.setItem('permisos', JSON.stringify(existing.filter(p => p.id !== id)));
    }

    if (!isMock) {
        try {
            await deleteDoc(doc(db, 'permisos', id));
        } catch (error) {
            console.error("Error al borrar permiso en Firestore:", error);
        }
    }
    return true;
}

export async function updateOficio(id, newData) {
    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('oficios') || '[]');
        const index = existing.findIndex(o => o.id === id);
        if (index !== -1) {
            existing[index] = { ...existing[index], ...newData };
            localStorage.setItem('oficios', JSON.stringify(existing));
        }
        return true;
    }
    await updateDoc(doc(db, 'oficios', id), newData);
    return true;
}

export async function updatePermiso(id, newData) {
    if (newData.fechaInicio && newData.fechaFin) {
        newData.diasUsados = calculateDays(newData.fechaInicio, newData.fechaFin, newData.jornada || 'Completa');
    }

    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('permisos') || '[]');
        const index = existing.findIndex(p => p.id === id);
        if (index !== -1) {
            existing[index] = { ...existing[index], ...newData };
            localStorage.setItem('permisos', JSON.stringify(existing));
        }
        return true;
    }
    await updateDoc(doc(db, 'permisos', id), newData);
    return true;
}

export async function deleteLicencia(id) {
    // 1. Limpieza Local Prioritaria
    const existing = JSON.parse(localStorage.getItem('licencias') || '[]');
    if (existing.some(p => p.id === id)) {
        localStorage.setItem('licencias', JSON.stringify(existing.filter(p => p.id !== id)));
    }

    // 2. Limpieza en la Nube
    if (!isMock) {
        try {
            await deleteDoc(doc(db, 'licencias', id));
        } catch (error) {
            console.error("Error al borrar licencia en Firestore:", error);
        }
    }
    return true;
}

export async function updateLicencia(id, newData) {
    if (newData.fechaInicio && newData.fechaFin) {
        newData.diasUsados = calculateDays(newData.fechaInicio, newData.fechaFin, newData.jornada || 'Completa');
    }

    if (isMock) {
        const existing = JSON.parse(localStorage.getItem('licencias') || '[]');
        const index = existing.findIndex(p => p.id === id);
        if (index !== -1) {
            existing[index] = { ...existing[index], ...newData };
            localStorage.setItem('licencias', JSON.stringify(existing));
        }
        return true;
    }
    await updateDoc(doc(db, 'licencias', id), newData);
    return true;
}
