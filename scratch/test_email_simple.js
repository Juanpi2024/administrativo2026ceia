import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_8g1c08g";
const TEMPLATE_ID = "template_z3wyt6o";
const PUBLIC_KEY = "oGfZuz24YntoK4lpr";

// Test direct call
const test = async () => {
    console.log("Testing EmailJS with keys:");
    console.log("Service:", SERVICE_ID);
    console.log("Template:", TEMPLATE_ID);
    console.log("Key:", PUBLIC_KEY);

    try {
        const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    to_name: "Test User",
                    user_email: "juan.ramirez@slepla.gob.cl",
                    tipo_tramite: "Prueba Tecnica",
                    id_tramite: "TEST-001"
                }
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error("Error:", e);
    }
};

test();
