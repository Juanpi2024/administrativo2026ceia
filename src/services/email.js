import emailjs from '@emailjs/browser';

const isMock = !import.meta.env.VITE_EMAILJS_SERVICE_ID;

export async function sendPermisoEmail(userEmail, userName, taken, left, permisoInfo) {
    if (isMock) {
        console.log(`[SIMULACIÓN CORREO] Para: ${userEmail}. Tu permiso para las fechas ${permisoInfo.fechaInicio} al ${permisoInfo.fechaFin} ha sido registrado.`);
        console.log(`[SIMULACIÓN CORREO] Días usados historicos: ${taken}. Días que te quedan: ${left}.`);
        return;
    }

    const templateParams = {
        to_email: userEmail,
        to_name: userName,
        taken: taken,
        left: left,
        fecha_inicio: permisoInfo.fechaInicio,
        fecha_fin: permisoInfo.fechaFin,
        motivo: permisoInfo.motivo,
        id_permiso: permisoInfo.id
    };

    try {
        await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            templateParams,
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
        console.log("Correo enviado exitosamente a:", userEmail);
    } catch (error) {
        console.error("Error al enviar el correo:", error);
    }
}
