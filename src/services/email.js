import emailjs from '@emailjs/browser';

const isMock = !import.meta.env.VITE_EMAILJS_SERVICE_ID;

/**
 * Envia un correo genérico para trámites administrativos
 */
export async function sendAdminEmail(type, userName, userEmail, data) {
    if (isMock) {
        console.log(`[SIMULACIÓN CORREO] Tipo: ${type}. Para: ${userEmail}.`);
        console.log(`[SIMULACIÓN CORREO] Contenido:`, data);
        return;
    }

    const templateParams = {
        tipo_tramite: type,
        user_name: userName,
        user_email: userEmail,
        id_tramite: data.id || 'N/A',
        fecha_inicio: data.fechaInicio || data.fechaEmision || 'N/A',
        fecha_fin: data.fechaFin || 'N/A',
        motivo: data.motivo || data.materia || 'N/A',
        detalles_extra: data.detalles || `Estado: ${data.estado || 'Registrado'}`,
        // Para compatibilidad con placeholders comunes
        to_name: userName,
        to_email: userEmail,
        taken: data.taken || '',
        left: data.left || ''
    };

    try {
        await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            templateParams,
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
        console.log(`Correo de ${type} enviado exitosamente a:`, userEmail);
    } catch (error) {
        console.error(`Error al enviar el correo de ${type}:`, error);
    }
}

/**
 * Mantiene compatibilidad con la función existente
 */
export async function sendPermisoEmail(userEmail, userName, taken, left, permisoInfo) {
    return sendAdminEmail('Permiso Administrativo', userName, userEmail, {
        ...permisoInfo,
        taken,
        left,
        detalles: `Días usados: ${taken}. Disponibles: ${left}.`
    });
}

