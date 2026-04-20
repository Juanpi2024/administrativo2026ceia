
const axios = require('axios');

const data = {
    service_id: 'service_8g1c08g',
    template_id: 'template_z3wyt6o',
    user_id: 'oGfZuz24YntoK4lpr',
    template_params: {
        tipo_tramite: 'Prueba de Configuración',
        user_name: 'Juan Pablo Ramírez Yáñez',
        user_email: 'juan.ramirez@slepla.gob.cl',
        id_tramite: 'TEST-2026',
        fecha_inicio: '2026-04-20',
        fecha_fin: '2026-04-20',
        motivo: 'Verificación de envío automático de correos administrativos.',
        detalles_extra: 'Días usados: 0.5. Disponibles: 5.5.',
        to_name: 'Juan Pablo Ramírez Yáñez',
        to_email: 'juan.ramirez@slepla.gob.cl',
        taken: '0.5',
        left: '5.5'
    }
};

async function sendEmail() {
    try {
        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', data);
        console.log('SUCCESS!', response.status, response.data);
    } catch (error) {
        console.log('FAILED...', error.response ? error.response.data : error.message);
    }
}

sendEmail();
