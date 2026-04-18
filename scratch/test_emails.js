import { funcionariosBirthdays } from '../src/data/birthdays.js';

const generateEmail = (fullName) => {
    // Normalization: Remove * and extra spaces
    const cleanName = fullName.replace(/\*/g, '').trim();
    const parts = cleanName.split(/\s+/);
    
    // Logic: Assuming APELLIDO_P APELLIDO_M NOMBRE1 NOMBRE2...
    // This is common in Chilean administrative lists.
    // If there are at least 3 parts, we take parts[2] as first name and parts[0] as first apellido.
    // If there are 2 parts, parts[1] is name, parts[0] is apellido.
    
    let firstName = '';
    let firstApellido = '';
    
    if (parts.length >= 3) {
        // Find the first name. Sometimes it's APELLIDO1 APELLIDO2 NOMBRE1...
        // But some people have complex surnames.
        // Let's look at the data. 
        // "ALEGRIA MARTINEZ VANESSA DE L." -> VANESSA is index 2
        // "URRA ESPINOSA ROSICLER PAULINA" -> ROSICLER is index 2
        firstName = parts[2];
        firstApellido = parts[0];
    } else if (parts.length === 2) {
        firstName = parts[1];
        firstApellido = parts[0];
    } else {
        firstName = parts[0];
        firstApellido = 'sinapellido';
    }

    const normalize = (str) => {
        return str.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z]/g, ""); // Keep only letters
    };

    return `${normalize(firstName)}.${normalize(firstApellido)}@slepla.gob.cl`;
};

const emails = funcionariosBirthdays.map(f => ({
    original: f.nombre,
    email: generateEmail(f.nombre)
}));

console.log(JSON.stringify(emails, null, 2));
